// Ascon hashing and MAC. Ascon-Hash256, Ascon-XOF128 and Ascon-CXOF128 follow NIST SP 800-232, as js-ascon (MIT) does
// for CyberChef's Ascon Hash; Ascon-Hash and Ascon-Hasha follow the earlier Ascon v1.2 specification (big-endian), and
// Ascon-Mac is ported from CyberChef (Apache-2.0) v11.5.0: src/core/vendor/ascon.mjs. 64-bit words are held as two
// 32-bit halves instead of BigInt, which is much faster.

class AsconState {
  readonly high = new Uint32Array(5);
  readonly low = new Uint32Array(5);

  constructor(words: [number, number][]) {
    words.forEach(([high, low], i) => {
      this.high[i] = high;
      this.low[i] = low;
    });
  }

  permute(rounds: number) {
    const h = this.high;
    const l = this.low;
    for (let r = 12 - rounds; r < 12; r++) {
      l[2] ^= 0xf0 - r * 0x10 + r;
      // Substitution layer.
      h[0] ^= h[4];
      l[0] ^= l[4];
      h[4] ^= h[3];
      l[4] ^= l[3];
      h[2] ^= h[1];
      l[2] ^= l[1];
      const th = [0, 1, 2, 3, 4].map((i) => h[i] ^ (~h[(i + 1) % 5] & h[(i + 2) % 5]));
      const tl = [0, 1, 2, 3, 4].map((i) => l[i] ^ (~l[(i + 1) % 5] & l[(i + 2) % 5]));
      h[0] = th[0] ^ th[4];
      l[0] = tl[0] ^ tl[4];
      h[1] = th[1] ^ th[0];
      l[1] = tl[1] ^ tl[0];
      h[2] = ~th[2];
      l[2] = ~tl[2];
      h[3] = th[3] ^ th[2];
      l[3] = tl[3] ^ tl[2];
      h[4] = th[4];
      l[4] = tl[4];
      // Linear diffusion layer.
      this.diffuse(0, 19, 28);
      this.diffuse(1, 61, 39);
      this.diffuse(2, 1, 6);
      this.diffuse(3, 10, 17);
      this.diffuse(4, 7, 41);
    }
  }

  /** x ^= (x >>> a) ^ (x >>> b), rotations on 64 bits. */
  private diffuse(i: number, a: number, b: number) {
    const [h, l] = [this.high[i], this.low[i]];
    const [ah, al] = rotr(h, l, a);
    const [bh, bl] = rotr(h, l, b);
    this.high[i] = h ^ ah ^ bh;
    this.low[i] = l ^ al ^ bl;
  }

  xorWord(i: number, [high, low]: [number, number]) {
    this.high[i] ^= high;
    this.low[i] ^= low;
  }

  word(i: number): [number, number] {
    return [this.high[i], this.low[i]];
  }
}

function rotr(high: number, low: number, n: number): [number, number] {
  if (n >= 32) {
    [high, low] = [low, high];
    n -= 32;
  }
  if (n === 0) {
    return [high, low];
  }
  return [((high >>> n) | (low << (32 - n))) >>> 0, ((low >>> n) | (high << (32 - n))) >>> 0];
}

/** Up to 8 bytes as a little-endian 64-bit word. */
function loadLe(bytes: Uint8Array, offset: number, length = 8): [number, number] {
  let high = 0;
  let low = 0;
  for (let i = 0; i < length; i++) {
    const byte = bytes[offset + i];
    if (i < 4) {
      low |= byte << (8 * i);
    } else {
      high |= byte << (8 * (i - 4));
    }
  }
  return [high >>> 0, low >>> 0];
}

/** Up to 8 bytes as a big-endian 64-bit word, the first byte being the most significant. */
function loadBe(bytes: Uint8Array, offset: number, length = 8): [number, number] {
  const padded = new Uint8Array(8);
  padded.set(bytes.subarray(offset, offset + length));
  return [
    ((padded[0] << 24) | (padded[1] << 16) | (padded[2] << 8) | padded[3]) >>> 0,
    ((padded[4] << 24) | (padded[5] << 16) | (padded[6] << 8) | padded[7]) >>> 0,
  ];
}

function storeLe([high, low]: [number, number], out: number[], length = 8) {
  for (let i = 0; i < length; i++) {
    out.push(i < 4 ? (low >>> (8 * i)) & 0xff : (high >>> (8 * (i - 4))) & 0xff);
  }
}

function storeBe([high, low]: [number, number], out: number[], length = 8) {
  const bytes = [
    high >>> 24,
    (high >>> 16) & 0xff,
    (high >>> 8) & 0xff,
    high & 0xff,
    low >>> 24,
    (low >>> 16) & 0xff,
    (low >>> 8) & 0xff,
    low & 0xff,
  ];
  out.push(...bytes.slice(0, length));
}

/** A one-byte padding at `position` of a lane. */
const padLe = (position: number): [number, number] =>
  position < 4 ? [0, 1 << (8 * position)] : [1 << (8 * (position - 4)), 0];
const padBe = (position: number): [number, number] => {
  const bytes = new Uint8Array(8);
  bytes[position] = 0x80;
  return loadBe(bytes, 0);
};

/** Absorbs the message 8 bytes at a time, padded, with `rounds` between the blocks (none after the last). */
function absorb(state: AsconState, message: Uint8Array, rounds: number, bigEndian: boolean) {
  const load = bigEndian ? loadBe : loadLe;
  let offset = 0;
  for (; offset + 8 <= message.length; offset += 8) {
    state.xorWord(0, load(message, offset));
    state.permute(rounds);
  }
  const rest = message.length - offset;
  state.xorWord(0, load(message, offset, rest));
  state.xorWord(0, bigEndian ? padBe(rest) : padLe(rest));
}

function squeeze(state: AsconState, length: number, rounds: number, bigEndian: boolean): Uint8Array {
  const out: number[] = [];
  while (out.length < length) {
    (bigEndian ? storeBe : storeLe)(state.word(0), out, Math.min(8, length - out.length));
    if (out.length < length) {
      state.permute(rounds);
    }
  }
  return new Uint8Array(out);
}

export type AsconHashVariant = 'Ascon-Hash256' | 'Ascon-XOF128' | 'Ascon-CXOF128' | 'Ascon-Hash' | 'Ascon-Hasha';

/**
 * Hashes with an Ascon variant. `length` is the output length in bytes (32 for the hashes), `customization` is the
 * string of Ascon-CXOF128 (at most 256 bytes).
 */
export function asconHash(
  message: Uint8Array,
  variant: AsconHashVariant = 'Ascon-Hash256',
  { length = 32, customization = new Uint8Array(0) }: { length?: number; customization?: Uint8Array } = {},
): Uint8Array {
  if (variant === 'Ascon-Hash' || variant === 'Ascon-Hasha') {
    // Ascon v1.2: the IV holds 0, the rate in bits, a, a - b and the tag length on 4 bytes, big-endian.
    const b = variant === 'Ascon-Hasha' ? 8 : 12;
    const state = new AsconState([
      loadBe(new Uint8Array([0, 64, 12, 12 - b, 0, 0, 1, 0]), 0),
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ]);
    state.permute(12);
    absorb(state, message, b, true);
    state.permute(12);
    return squeeze(state, 32, b, true);
  }
  if (!(Number.isInteger(length) && length > 0)) {
    throw new RangeError('The output length must be a positive number of bytes');
  }
  if (customization.length > 256) {
    throw new RangeError('The customization string has at most 256 bytes');
  }
  const ids = { 'Ascon-Hash256': 2, 'Ascon-XOF128': 3, 'Ascon-CXOF128': 4 };
  const tagLength = variant === 'Ascon-Hash256' ? 256 : 0;
  // SP 800-232: the IV holds the variant, 0, the rounds, the tag length on 2 bytes and the rate, little-endian.
  const iv = new Uint8Array([ids[variant], 0, 0xcc, tagLength & 0xff, tagLength >> 8, 8, 0, 0]);
  const state = new AsconState([loadLe(iv, 0), [0, 0], [0, 0], [0, 0], [0, 0]]);
  state.permute(12);
  if (variant === 'Ascon-CXOF128') {
    const bits = customization.length * 8;
    state.xorWord(0, [Math.floor(bits / 2 ** 32), bits >>> 0]);
    state.permute(12);
    absorb(state, customization, 12, false);
    state.permute(12);
  }
  absorb(state, message, 12, false);
  state.permute(12);
  return squeeze(state, variant === 'Ascon-Hash256' ? 32 : length, 12, false);
}

/** Ascon-Mac with a 16 byte key and a 16 byte tag, as in CyberChef. */
export function asconMac(key: Uint8Array, message: Uint8Array, tagLength = 16): Uint8Array {
  if (key.length !== 16) {
    throw new RangeError(`Ascon-Mac requires a key of exactly 16 bytes, not ${key.length}`);
  }
  const state = new AsconState([[0x00102000, 0x80cc0005], loadLe(key, 0), loadLe(key, 8), [0, 0], [0, 0]]);
  state.permute(12);
  // Absorbs 32 bytes at a time, in the first four words.
  let offset = 0;
  let word = 0;
  for (; offset + 8 <= message.length; offset += 8) {
    state.xorWord(word, loadLe(message, offset));
    word++;
    if (word === 4) {
      word = 0;
      state.permute(12);
    }
  }
  const rest = message.length - offset;
  state.xorWord(word, loadLe(message, offset, rest));
  state.xorWord(word, padLe(rest));
  state.xorWord(4, [0x80000000, 0]);
  state.permute(12);
  // Squeezes 16 bytes at a time, from the first two words.
  const out: number[] = [];
  word = 0;
  while (out.length < tagLength) {
    storeLe(state.word(word), out, Math.min(8, tagLength - out.length));
    word++;
    if (word === 2 && out.length < tagLength) {
      word = 0;
      state.permute(12);
    }
  }
  return new Uint8Array(out);
}
