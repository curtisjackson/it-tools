import { describe, expect, it } from 'vitest';
import {
  compressBytes,
  decompressBytes,
  detectCompression,
  lzStringCompress,
  lzStringDecompress,
  lzStringFormats,
} from './compression-converter.service';
import { lz4Compress, lz4Decompress, xxh32 } from './lz4';
import {
  BZIP2_VECTORS,
  BZIP2_ZEROS,
  CAT,
  LZ4_VECTORS,
  LZMA_BINARY,
  LZMA_VECTORS,
  REPEATED_LZ4,
  repeatedText,
} from './compression-converter.vectors';
import { base64ToBytes, bytesToHex, hexToBytes } from '@/utils/bytes';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((byte, i) => byte === b[i]);

function sampleBytes(size: number) {
  const bytes = new Uint8Array(size);
  let seed = 1;
  for (let i = 0; i < size; i++) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    bytes[i] = i % 3 === 0 ? seed >>> 24 : i % 251;
  }
  return bytes;
}

describe('lz-string', () => {
  it('matches the CyberChef vector', () => {
    expect(lzStringCompress('hello world', 'base64')).toBe('BYUwNmD2AEDukCcwBMg=');
    expect(lzStringDecompress('BYUwNmD2AEDukCcwBMg=', 'base64')).toBe('hello world');
  });

  it.each(lzStringFormats)('round-trips text in the %s format', (format) => {
    const text = 'Съешь же ещё этих мягких французских булок 🥐 '.repeat(20);
    expect(lzStringDecompress(lzStringCompress(text, format), format)).toBe(text);
  });

  it('rejects input that is not lz-string data', () => {
    expect(() => lzStringDecompress('not base64!', 'base64')).toThrow();
    expect(() => lzStringDecompress('', 'base64')).not.toThrow();
  });
});

describe('xxh32', () => {
  it('matches the reference values', () => {
    expect(xxh32(new Uint8Array())).toBe(0x02cc5d05);
    expect(xxh32(encode('abc'))).toBe(0x32d153ff);
    expect(xxh32(encode(CAT))).toBe(0xce094b1e);
  });
});

describe('lz4', () => {
  it('compresses like CyberChef', () => {
    expect(bytesToHex(lz4Compress(encode(CAT)))).toBe(LZ4_VECTORS[0].hex);
  });

  it.each(LZ4_VECTORS)('decompresses the $name frame', ({ hex }) => {
    expect(decode(lz4Decompress(hexToBytes(hex)))).toBe(CAT);
  });

  it('follows matches into earlier linked blocks', () => {
    expect(decode(lz4Decompress(base64ToBytes(REPEATED_LZ4)))).toBe(repeatedText());
  });

  it('reads several frames and skips skippable ones', () => {
    const frame = hexToBytes(LZ4_VECTORS[1].hex);
    const skippable = hexToBytes('512a4d1803000000aabbcc');
    const joined = new Uint8Array([...frame, ...skippable, ...frame]);
    expect(decode(lz4Decompress(joined))).toBe(CAT + CAT);
  });

  it('round-trips binary data larger than one block', () => {
    const bytes = sampleBytes(5_000_000);
    expect(sameBytes(lz4Decompress(lz4Compress(bytes)), bytes)).toBe(true);
  });

  it('rejects broken data', () => {
    const corrupted = hexToBytes(LZ4_VECTORS[1].hex);
    corrupted[12] ^= 1;
    expect(() => lz4Decompress(corrupted)).toThrow('content checksum');
    expect(() => lz4Decompress(encode(CAT))).toThrow('not LZ4');
    expect(() => lz4Decompress(hexToBytes(LZ4_VECTORS[0].hex).subarray(0, 20))).toThrow();
  });
});

describe('lzma', () => {
  it.each(LZMA_VECTORS)('decompresses the $name vector to the original bytes', async ({ hex, text }) => {
    expect(await decompressBytes('lzma', hexToBytes(hex))).toEqual(encode(text));
  });

  it('decompresses binary data', async () => {
    expect(bytesToHex(await decompressBytes('lzma', hexToBytes(LZMA_BINARY)))).toBe(
      '000102030405060708090a0b0c0d0e0f10',
    );
  });

  it('round-trips at every level', async () => {
    const bytes = sampleBytes(20_000);
    for (const lzmaLevel of [1, 6, 9] as const) {
      const compressed = await compressBytes('lzma', bytes, { lzmaLevel });
      expect(compressed[0]).toBe(0x5d);
      expect(await decompressBytes('lzma', compressed)).toEqual(bytes);
    }
  });

  it('reports progress', async () => {
    const progress: number[] = [];
    await compressBytes('lzma', sampleBytes(10_000), { lzmaLevel: 1 }, (fraction) => progress.push(fraction));
    expect(progress.at(-1)).toBe(1);
  });

  it('rejects data that is not LZMA', async () => {
    await expect(decompressBytes('lzma', encode(CAT))).rejects.toThrow();
    await expect(decompressBytes('lzma', hexToBytes('fd377a585a000004e6d6b446'))).rejects.toThrow('.xz');
  });
});

describe('bzip2', () => {
  it('compresses like bzip2 -9', async () => {
    expect(bytesToHex(await compressBytes('bzip2', encode(CAT)))).toBe(BZIP2_VECTORS[1].hex);
  });

  it.each(BZIP2_VECTORS)('decompresses the $name vector', async ({ hex, text }) => {
    expect(decode(await decompressBytes('bzip2', hexToBytes(hex)))).toBe(text);
  });

  it('outputs more than 10 MB', async () => {
    const output = await decompressBytes('bzip2', hexToBytes(BZIP2_ZEROS));
    expect(output.length).toBe(20_000_000);
    expect(output.every((byte) => byte === 0)).toBe(true);
  });

  it('round-trips with every block size', async () => {
    const bytes = sampleBytes(300_000);
    for (const bzip2BlockSize of [1, 5, 9]) {
      const compressed = await compressBytes('bzip2', bytes, { bzip2BlockSize, bzip2WorkFactor: 0 });
      expect(compressed[3]).toBe(0x30 + bzip2BlockSize);
      expect(sameBytes(await decompressBytes('bzip2', compressed), bytes)).toBe(true);
    }
  });

  it('rejects broken data', async () => {
    const corrupted = hexToBytes(BZIP2_VECTORS[1].hex);
    corrupted[30] ^= 1;
    await expect(decompressBytes('bzip2', corrupted)).rejects.toThrow('Bzip2');
    await expect(decompressBytes('bzip2', encode(CAT))).rejects.toThrow('Not bzip data');
  });
});

describe('detectCompression', () => {
  it('recognises the formats by their first bytes', () => {
    expect(detectCompression(hexToBytes(LZ4_VECTORS[0].hex))).toBe('lz4');
    expect(detectCompression(hexToBytes(LZ4_VECTORS[3].hex))).toBe('lz4');
    expect(detectCompression(hexToBytes(LZMA_BINARY))).toBe('lzma');
    expect(detectCompression(hexToBytes('fd377a585a00'))).toBe('xz');
    expect(detectCompression(hexToBytes('1f8b0800'))).toBe('gzip');
    expect(detectCompression(hexToBytes(BZIP2_VECTORS[0].hex))).toBe('bzip2');
    expect(detectCompression(encode(CAT))).toBeUndefined();
  });
});
