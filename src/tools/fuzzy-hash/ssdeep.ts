// SSDEEP (context triggered piecewise hashing, spamsum). The digest is ported from ssdeep.js 0.0.3 (MIT,
// https://github.com/cloudtracer/ssdeep.js), which CyberChef (Apache-2.0) v11.5.0 uses in src/core/operations/SSDEEP.mjs,
// with one fix to follow ssdeep 2.14: no last character is added when the rolling hash ends at zero (data ending with
// 7 or more zero bytes). The comparison follows ssdeep's fuzzy_compare (ssdeep.js used a plain edit distance and read
// the block size as a Base64 digit, so different block sizes were compared wrongly).

const HASH_PRIME = 0x01000193;
const HASH_INIT = 0x28021967;
const ROLLING_WINDOW = 7;
const SPAMSUM_LENGTH = 64;
const MIN_BLOCKSIZE = 3;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const fnv = (hash: number, byte: number) => (Math.imul(hash, HASH_PRIME) ^ byte) >>> 0;

class RollingHash {
  private readonly window = new Uint8Array(ROLLING_WINDOW);
  private h1 = 0;
  private h2 = 0;
  private h3 = 0;
  private n = 0;

  update(byte: number) {
    this.h2 = (this.h2 - this.h1 + ROLLING_WINDOW * byte) >>> 0;
    this.h1 = (this.h1 + byte - this.window[this.n % ROLLING_WINDOW]) >>> 0;
    this.window[this.n % ROLLING_WINDOW] = byte;
    this.n++;
    this.h3 = ((this.h3 << 5) ^ byte) >>> 0;
  }

  sum() {
    return (this.h1 + this.h2 + this.h3) >>> 0;
  }
}

function piecewise(bytes: Uint8Array, blockSize: number): [string, string] {
  let first = '';
  let second = '';
  let h1 = HASH_INIT;
  let h2 = HASH_INIT;
  const roll = new RollingHash();
  for (const byte of bytes) {
    h1 = fnv(h1, byte);
    h2 = fnv(h2, byte);
    roll.update(byte);
    const sum = roll.sum();
    if (first.length < SPAMSUM_LENGTH - 1 && sum % blockSize === blockSize - 1) {
      first += B64[h1 & 63];
      h1 = HASH_INIT;
    }
    if (second.length < SPAMSUM_LENGTH / 2 - 1 && sum % (blockSize * 2) === blockSize * 2 - 1) {
      second += B64[h2 & 63];
      h2 = HASH_INIT;
    }
  }
  if (bytes.length > 0 && roll.sum() !== 0) {
    first += B64[h1 & 63];
    second += B64[h2 & 63];
  }
  return [first, second];
}

export function ssdeep(bytes: Uint8Array): string {
  let blockSize = MIN_BLOCKSIZE;
  while (blockSize * SPAMSUM_LENGTH < bytes.length) {
    blockSize *= 2;
  }
  let signatures: [string, string];
  for (;;) {
    signatures = piecewise(bytes, blockSize);
    if (blockSize <= MIN_BLOCKSIZE || signatures[0].length >= SPAMSUM_LENGTH / 2) {
      break;
    }
    blockSize = Math.floor(blockSize / 2);
  }
  return `${blockSize}:${signatures[0]}:${signatures[1]}`;
}

/** Shortens the runs of more than 3 identical characters to 3. */
const eliminateSequences = (text: string) => text.replace(/(.)\1{3,}/g, '$1$1$1');

function hasCommonSubstring(a: string, b: string): boolean {
  if (a.length < ROLLING_WINDOW || b.length < ROLLING_WINDOW) {
    return false;
  }
  const windows = new Set<string>();
  for (let i = 0; i + ROLLING_WINDOW <= a.length; i++) {
    windows.add(a.slice(i, i + ROLLING_WINDOW));
  }
  for (let i = 0; i + ROLLING_WINDOW <= b.length; i++) {
    if (windows.has(b.slice(i, i + ROLLING_WINDOW))) {
      return true;
    }
  }
  return false;
}

/** Edit distance where an insertion or a removal costs 1 and a replacement 2, as in ssdeep. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 2));
    }
    previous = current;
  }
  return previous[b.length];
}

function scoreStrings(a: string, b: string, blockSize: number): number {
  if (a.length > SPAMSUM_LENGTH || b.length > SPAMSUM_LENGTH || !hasCommonSubstring(a, b)) {
    return 0;
  }
  let score = Math.floor((editDistance(a, b) * SPAMSUM_LENGTH) / (a.length + b.length));
  score = Math.floor((100 * score) / SPAMSUM_LENGTH);
  if (score >= 100) {
    return 0;
  }
  score = 100 - score;
  // With small block sizes, a match of a few characters means little.
  const cap = Math.floor(blockSize / MIN_BLOCKSIZE) * Math.min(a.length, b.length);
  return blockSize >= Math.floor((99 + ROLLING_WINDOW) / ROLLING_WINDOW) * MIN_BLOCKSIZE ? score : Math.min(score, cap);
}

export function parseSsdeep(hash: string): { blockSize: number; first: string; second: string } {
  const match = /^(\d+):([A-Za-z0-9+/]*):([A-Za-z0-9+/]*)(?:,.*)?$/.exec(hash.trim());
  if (!match) {
    throw new Error(`Not an SSDEEP hash: "${hash.trim()}"`);
  }
  return { blockSize: Number(match[1]), first: match[2], second: match[3] };
}

/** The similarity of two SSDEEP hashes, from 0 to 100. */
export function compareSsdeep(hash1: string, hash2: string): number {
  const a = parseSsdeep(hash1);
  const b = parseSsdeep(hash2);
  if (a.blockSize !== b.blockSize && a.blockSize !== b.blockSize * 2 && b.blockSize !== a.blockSize * 2) {
    return 0;
  }
  const [a1, a2, b1, b2] = [a.first, a.second, b.first, b.second].map(eliminateSequences);
  if (a.blockSize === b.blockSize && a1 === b1) {
    return 100;
  }
  if (a.blockSize === b.blockSize) {
    return Math.max(scoreStrings(a1, b1, a.blockSize), scoreStrings(a2, b2, a.blockSize * 2));
  }
  return a.blockSize === b.blockSize * 2 ? scoreStrings(a1, b2, a.blockSize) : scoreStrings(a2, b1, b.blockSize);
}
