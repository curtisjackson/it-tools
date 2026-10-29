// Ported from node-md6 0.1.0 (CC0-1.0, https://github.com/Neo-Desktop/md6), the MD6 implementation CyberChef
// (Apache-2.0) v11.5.0 uses in src/core/operations/MD6.mjs. It hashes bytes (node-md6 only took text, which it encoded
// as CESU-8, so characters outside the BMP hashed wrongly), and the number of rounds is 40 + ⌊d/4⌋ as in the
// specification. 64-bit words are kept as pairs of 32-bit halves, [high, low].

type Word = [number, number];

const toWords = (bytes: number[]): Word[] => {
  const words: Word[] = [];
  for (let i = 0; i < bytes.length; i += 8) {
    words.push([
      (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3],
      (bytes[i + 4] << 24) | (bytes[i + 5] << 16) | (bytes[i + 6] << 8) | bytes[i + 7],
    ]);
  }
  return words;
};

const fromWords = (words: Word[]): number[] =>
  words.flatMap(([high, low]) => [
    high >>> 24,
    (high >>> 16) & 0xff,
    (high >>> 8) & 0xff,
    high & 0xff,
    low >>> 24,
    (low >>> 16) & 0xff,
    (low >>> 8) & 0xff,
    low & 0xff,
  ]);

const S0: Word = [0x01234567, 0x89abcdef];
const SM: Word = [0x7311c281, 0x2425cfa0];
const Q: Word[] = [
  [0x7311c281, 0x2425cfa0],
  [0x64322864, 0x34aac8e7],
  [0xb60450e9, 0xef68b7c1],
  [0xe8fb2390, 0x8d9f06f1],
  [0xdd2e76cb, 0xa691e5bf],
  [0x0cd0d63b, 0x2c30bc41],
  [0x1f8ccf68, 0x23058f8a],
  [0x54e5ed5b, 0x88e3775d],
  [0x4ad12aae, 0x0a6d6031],
  [0x3e7f16bb, 0x88222e0d],
  [0x8af8671d, 0x3fb50c2c],
  [0x995ad117, 0x8bd25c31],
  [0xc878c1dd, 0x04c4b633],
  [0x3b72066c, 0x7a1552ac],
  [0x0d6f3522, 0x631effcb],
];
const TAPS = [17, 18, 21, 31, 67, 89];
const RIGHT_SHIFTS = [10, 5, 13, 10, 11, 12, 2, 7, 14, 15, 7, 13, 11, 7, 6, 12];
const LEFT_SHIFTS = [11, 24, 9, 16, 15, 9, 27, 15, 6, 2, 29, 8, 15, 5, 31, 9];
/** Block size and chaining size in bytes. */
const B = 512;
const C = 128;
const N = 89;

export interface Md6Options {
  /** Digest size in bits, 1 to 512. */
  size?: number;
  /** Mode: up to `levels` levels of the tree, then sequential. 64 is the standard. */
  levels?: number;
  key?: Uint8Array;
}

export function md6(
  data: Uint8Array,
  { size = 256, levels = 64, key = new Uint8Array(0) }: Md6Options = {},
): Uint8Array {
  if (!(size >= 1 && size <= 512)) {
    throw new RangeError('The MD6 size is 1 to 512 bits');
  }
  if (!(levels >= 0)) {
    throw new RangeError('The number of MD6 levels must be positive');
  }
  const keyBytes = [...key.subarray(0, 64)];
  const keyLength = keyBytes.length;
  const K = toWords([...keyBytes, ...Array.from({ length: 64 - keyLength }, () => 0)]);
  const rounds = Math.max(keyLength ? 80 : 0, 40 + Math.floor(size / 4));
  let level = 0;

  // The 89 + 16 × rounds words of the compression, as high and low halves.
  const steps = N + 16 * rounds;
  const high = new Uint32Array(steps);
  const low = new Uint32Array(steps);
  const compress = (input: Word[]): Word[] => {
    for (let w = 0; w < N; w++) {
      high[w] = input[w][0];
      low[w] = input[w][1];
    }
    let sHigh = S0[0];
    let sLow = S0[1];
    for (let j = 0, i = N; j < rounds; j++, i += 16) {
      for (let s = 0; s < 16; s++) {
        const k = i + s;
        const a = k - TAPS[5];
        const b = k - TAPS[0];
        const c1 = k - TAPS[1];
        const c2 = k - TAPS[2];
        const d1 = k - TAPS[3];
        const d2 = k - TAPS[4];
        let xh = sHigh ^ high[a] ^ high[b] ^ (high[c1] & high[c2]) ^ (high[d1] & high[d2]);
        let xl = sLow ^ low[a] ^ low[b] ^ (low[c1] & low[c2]) ^ (low[d1] & low[d2]);
        // x ^= x >>> r, then x ^= x << l, on 64 bits; every shift is below 32.
        const r = RIGHT_SHIFTS[s];
        xl ^= (xl >>> r) | (xh << (32 - r));
        xh ^= xh >>> r;
        const l = LEFT_SHIFTS[s];
        xh ^= (xh << l) | (xl >>> (32 - l));
        xl ^= xl << l;
        high[k] = xh;
        low[k] = xl;
      }
      // S = (S <<< 1) ^ (S & SM)
      const rotatedHigh = (sHigh << 1) | (sLow >>> 31);
      const rotatedLow = (sLow << 1) | (sHigh >>> 31);
      sHigh = rotatedHigh ^ (sHigh & SM[0]);
      sLow = rotatedLow ^ (sLow & SM[1]);
    }
    const output: Word[] = [];
    for (let w = steps - 16; w < steps; w++) {
      output.push([high[w] | 0, low[w] | 0]);
    }
    return output;
  };

  const mid = (block: Word[], chain: Word[], index: number, padding: number, final: number): Word[] => {
    const U: Word = [((level & 0xff) << 24) | (Math.floor(index / 2 ** 32) & 0xffffff), index | 0];
    const V: Word = [
      ((rounds & 0xfff) << 16) | ((levels & 0xff) << 8) | ((final & 0xf) << 4) | ((padding & 0xf000) >> 12),
      ((padding & 0xfff) << 20) | ((keyLength & 0xff) << 12) | (size & 0xfff),
    ];
    return compress([...Q, ...K, U, V, ...chain, ...block]);
  };

  /** Splits into blocks of `blockSize` bytes, padded with zeros; returns the blocks and the padding in bits. */
  const blocks = (message: number[], blockSize: number): [Word[][], number] => {
    const padded = [...message];
    let padding = 0;
    while (padded.length < 1 || padded.length % blockSize > 0) {
      padded.push(0);
      padding += 8;
    }
    const words = toWords(padded);
    const result: Word[][] = [];
    for (let i = 0; i < words.length; i += blockSize / 8) {
      result.push(words.slice(i, i + blockSize / 8));
    }
    return [result, padding];
  };

  const parallel = (message: number[]): number[] => {
    const final = message.length > B ? 0 : 1;
    const [list, padding] = blocks(message, B);
    const chain: Word[] = list.flatMap((block, i) => mid(block, [], i, i === list.length - 1 ? padding : 0, final));
    return fromWords(chain);
  };

  const sequential = (message: number[]): number[] => {
    const [list, padding] = blocks(message, B - C);
    let chain: Word[] = Array.from({ length: 16 }, (): Word => [0, 0]);
    list.forEach((block, i) => {
      const last = i === list.length - 1;
      chain = mid(block, chain, i, last ? padding : 0, last ? 1 : 0);
    });
    return fromWords(chain);
  };

  let message = [...data];
  do {
    level++;
    message = level > levels ? sequential(message) : parallel(message);
  } while (message.length !== C);

  // The digest is the last ⌈size/8⌉ bytes, with the unused low bits of the last byte cleared.
  const length = Math.ceil(size / 8);
  const digest = message.slice(message.length - length);
  if (size % 8) {
    digest[length - 1] &= (0xff << (8 - (size % 8))) & 0xff;
  }
  return new Uint8Array(digest);
}
