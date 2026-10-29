import { compress } from 'lz4js';

// LZ4 frame format: https://github.com/lz4/lz4/blob/dev/doc/lz4_Frame_format.md
const FRAME_MAGIC = 0x184d2204;
const LEGACY_MAGIC = 0x184c2102;
const SKIPPABLE_MAGIC = 0x184d2a50;
const LEGACY_BLOCK_SIZE = 8 << 20;
const BLOCK_SIZES: Record<number, number> = { 4: 64 << 10, 5: 256 << 10, 6: 1 << 20, 7: 4 << 20 };

const PRIME1 = 2654435761;
const PRIME2 = 2246822519;
const PRIME3 = 3266489917;
const PRIME4 = 668265263;
const PRIME5 = 374761393;

function rotl(value: number, bits: number) {
  return (value << bits) | (value >>> (32 - bits));
}

function readU32(bytes: Uint8Array, offset: number) {
  if (offset + 4 > bytes.length) {
    throw new Error('Unexpected end of data');
  }
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

export function xxh32(bytes: Uint8Array, seed = 0): number {
  const length = bytes.length;
  let offset = 0;
  let hash: number;
  if (length >= 16) {
    const lanes = [seed + PRIME1 + PRIME2, seed + PRIME2, seed, seed - PRIME1].map((lane) => lane | 0);
    for (; offset + 16 <= length; offset += 16) {
      for (let i = 0; i < 4; i++) {
        lanes[i] = Math.imul(rotl((lanes[i] + Math.imul(readU32(bytes, offset + i * 4), PRIME2)) | 0, 13), PRIME1);
      }
    }
    hash = rotl(lanes[0], 1) + rotl(lanes[1], 7) + rotl(lanes[2], 12) + rotl(lanes[3], 18);
  } else {
    hash = seed + PRIME5;
  }
  hash = (hash + length) | 0;
  for (; offset + 4 <= length; offset += 4) {
    hash = Math.imul(rotl((hash + Math.imul(readU32(bytes, offset), PRIME3)) | 0, 17), PRIME4);
  }
  for (; offset < length; offset++) {
    hash = Math.imul(rotl((hash + Math.imul(bytes[offset], PRIME5)) | 0, 11), PRIME1);
  }
  hash = Math.imul(hash ^ (hash >>> 15), PRIME2);
  hash = Math.imul(hash ^ (hash >>> 13), PRIME3);
  return (hash ^ (hash >>> 16)) >>> 0;
}

class Output {
  buffer = new Uint8Array(1 << 16);
  length = 0;

  reserve(size: number) {
    if (this.length + size > this.buffer.length) {
      const grown = new Uint8Array(Math.max(this.buffer.length * 2, this.length + size));
      grown.set(this.buffer.subarray(0, this.length));
      this.buffer = grown;
    }
  }

  result() {
    return this.buffer.slice(0, this.length);
  }
}

// Decodes one LZ4 block. Matches may reach back into earlier blocks, which covers
// frames with linked blocks.
function decodeBlock(src: Uint8Array, start: number, end: number, maxSize: number, out: Output) {
  out.reserve(maxSize);
  const limit = out.length + maxSize;
  const dst = out.buffer;
  let s = start;
  let d = out.length;

  const readLength = (initial: number) => {
    let length = initial;
    if (initial === 15) {
      let byte: number;
      do {
        if (s >= end) {
          throw new Error('Corrupted LZ4 block');
        }
        byte = src[s++];
        length += byte;
      } while (byte === 255);
    }
    return length;
  };

  while (s < end) {
    const token = src[s++];
    const literals = readLength(token >> 4);
    if (s + literals > end || d + literals > limit) {
      throw new Error('Corrupted LZ4 block');
    }
    dst.set(src.subarray(s, s + literals), d);
    s += literals;
    d += literals;
    if (s >= end) {
      break;
    }
    if (s + 2 > end) {
      throw new Error('Corrupted LZ4 block');
    }
    const offset = src[s] | (src[s + 1] << 8);
    s += 2;
    const length = readLength(token & 15) + 4;
    if (offset === 0 || offset > d || d + length > limit) {
      throw new Error('Corrupted LZ4 block');
    }
    if (offset >= length) {
      dst.copyWithin(d, d - offset, d - offset + length);
      d += length;
    } else {
      for (let i = 0; i < length; i++, d++) {
        dst[d] = dst[d - offset];
      }
    }
  }
  out.length = d;
}

function decodeFrame(src: Uint8Array, start: number, out: Output): number {
  let s = start + 4;
  if (s + 3 > src.length) {
    throw new Error('Unexpected end of data');
  }
  const flags = src[s];
  if (flags >> 6 !== 1) {
    throw new Error(`Unsupported LZ4 frame version ${flags >> 6}`);
  }
  if (flags & 1) {
    throw new Error('This LZ4 frame needs an external dictionary');
  }
  const maxBlockSize = BLOCK_SIZES[(src[s + 1] >> 4) & 7];
  if (maxBlockSize === undefined) {
    throw new Error('Invalid LZ4 block size');
  }
  const descriptorEnd = s + 2 + (flags & 8 ? 8 : 0);
  if (descriptorEnd + 1 > src.length) {
    throw new Error('Unexpected end of data');
  }
  if (((xxh32(src.subarray(s, descriptorEnd)) >>> 8) & 255) !== src[descriptorEnd]) {
    throw new Error('Wrong LZ4 frame header checksum');
  }
  const contentSize = flags & 8 ? readU32(src, s + 2) + readU32(src, s + 6) * 2 ** 32 : undefined;
  s = descriptorEnd + 1;
  const contentStart = out.length;

  while (true) {
    const header = readU32(src, s);
    s += 4;
    if (header === 0) {
      break;
    }
    const size = header & 0x7fffffff;
    if (size > maxBlockSize || s + size + (flags & 16 ? 4 : 0) > src.length) {
      throw new Error('Corrupted LZ4 frame');
    }
    if (flags & 16 && xxh32(src.subarray(s, s + size)) !== readU32(src, s + size)) {
      throw new Error('Wrong LZ4 block checksum');
    }
    if (header & 0x80000000) {
      out.reserve(size);
      out.buffer.set(src.subarray(s, s + size), out.length);
      out.length += size;
    } else {
      decodeBlock(src, s, s + size, maxBlockSize, out);
    }
    s += size + (flags & 16 ? 4 : 0);
  }

  if (contentSize !== undefined && out.length - contentStart !== contentSize) {
    throw new Error('LZ4 content size does not match');
  }
  if (flags & 4) {
    if (xxh32(out.buffer.subarray(contentStart, out.length)) !== readU32(src, s)) {
      throw new Error('Wrong LZ4 content checksum');
    }
    s += 4;
  }
  return s;
}

function isMagic(value: number) {
  return value === FRAME_MAGIC || value === LEGACY_MAGIC || (value & 0xfffffff0) === SKIPPABLE_MAGIC;
}

function decodeLegacyFrame(src: Uint8Array, start: number, out: Output): number {
  let s = start + 4;
  while (s + 4 <= src.length) {
    const size = readU32(src, s);
    if (isMagic(size)) {
      break;
    }
    s += 4;
    if (s + size > src.length) {
      throw new Error('Corrupted LZ4 frame');
    }
    decodeBlock(src, s, s + size, LEGACY_BLOCK_SIZE, out);
    s += size;
  }
  return s;
}

// Decompresses LZ4 frames as written by the lz4 tool: several frames in a row,
// skippable frames and the legacy format, with all checksums verified.
export function lz4Decompress(src: Uint8Array): Uint8Array {
  const out = new Output();
  let s = 0;
  do {
    const magic = readU32(src, s);
    if (magic === FRAME_MAGIC) {
      s = decodeFrame(src, s, out);
    } else if (magic === LEGACY_MAGIC) {
      s = decodeLegacyFrame(src, s, out);
    } else if ((magic & 0xfffffff0) === SKIPPABLE_MAGIC) {
      s += 8 + readU32(src, s + 4);
    } else {
      throw new Error('This is not LZ4 data: the frame magic number is missing');
    }
  } while (s < src.length);
  return out.result();
}

export function lz4Compress(src: Uint8Array): Uint8Array {
  return compress(src);
}
