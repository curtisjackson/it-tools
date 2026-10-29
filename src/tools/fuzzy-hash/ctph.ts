// The CTPH of ctph.js 0.0.5 (MIT, https://github.com/huwenshuo/ctph.js), as CyberChef (Apache-2.0) v11.5.0 computes it
// in src/core/operations/CTPH.mjs and CompareCTPHHashes.mjs. It is not compatible with ssdeep: the block size is
// written as a Base64 digit and the FNV multiplication is done on doubles. Kept byte for byte for CyberChef users.

const HASH_PRIME = 0x01000193;
const HASH_INIT = 0x28021967;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const fnv = (base: number, byte: number) => ((base * HASH_PRIME) ^ byte) >>> 0;

function piecewise(bytes: Uint8Array, trigger: number): [string, string] {
  let first = '';
  let second = '';
  let h1 = HASH_INIT;
  let h2 = HASH_INIT;
  let x = 0;
  let y = 0;
  let z = 0;
  const window: number[] = [];
  bytes.forEach((byte, i) => {
    h1 = fnv(h1, byte);
    h2 = fnv(h2, byte);
    y += 7 * byte - x;
    x += byte - (window[i % 7] ?? 0);
    window[i % 7] = byte;
    z = ((z << 5) ^ byte) >>> 0;
    const sum = (x + y + z) >>> 0;
    const last = i === bytes.length - 1;
    if (last || sum % trigger === trigger - 1) {
      first += B64[h1 & 63];
      h1 = HASH_INIT;
    }
    if (last || sum % (trigger * 2) === trigger * 2 - 1) {
      second += B64[h2 & 63];
      h2 = HASH_INIT;
    }
  });
  return [first, second];
}

export function ctph(bytes: Uint8Array): string {
  const minimum = 3;
  let index = Math.max(3, Math.ceil(Math.log(bytes.length / (64 * minimum)) / Math.log(2)));
  let signatures = piecewise(bytes, minimum << index);
  while (index > 0 && signatures[0].length < 32) {
    signatures = piecewise(bytes, minimum << --index);
  }
  return `${B64[index]}:${signatures[0]}:${signatures[1]}`;
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

const matchScore = (a: string, b: string) => (1 - levenshtein(a, b) / Math.max(a.length, b.length)) * 100;

export function parseCtph(hash: string): { index: number; first: string; second: string } {
  const match = /^([A-Za-z0-9+/]):([A-Za-z0-9+/]*):([A-Za-z0-9+/]*)$/.exec(hash.trim());
  if (!match) {
    throw new Error(`Not a CTPH hash: "${hash.trim()}"`);
  }
  return { index: B64.indexOf(match[1]), first: match[2], second: match[3] };
}

/** The similarity of two CTPH hashes, from 0 to 100, as in ctph.js. */
export function compareCtph(hash1: string, hash2: string): number {
  let [a, b] = [parseCtph(hash1), parseCtph(hash2)];
  if (a.index > b.index) {
    [a, b] = [b, a];
  }
  if (b.index - a.index > 1) {
    return 0;
  }
  return a.index === b.index ? matchScore(a.first, b.first) : matchScore(a.second, b.first);
}
