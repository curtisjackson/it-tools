// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/MurmurHash3.mjs (32-bit x86 variant). It hashes
// bytes (CyberChef kept the low byte of each UTF-16 code unit, so text outside Latin-1 hashed wrongly) and uses
// Math.imul for the 32-bit multiplications.

const C1 = 0xcc9e2d51;
const C2 = 0x1b873593;

const rotl = (value: number, bits: number) => (value << bits) | (value >>> (32 - bits));

function mixKey(key: number): number {
  return Math.imul(rotl(Math.imul(key, C1), 15), C2);
}

/** MurmurHash3 x86 32-bit, as an unsigned integer. */
export function murmurHash3(bytes: Uint8Array, seed = 0): number {
  let hash = seed >>> 0;
  const blocks = bytes.length & ~3;
  for (let i = 0; i < blocks; i += 4) {
    hash ^= mixKey(bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24));
    hash = (Math.imul(rotl(hash, 13), 5) + 0xe6546b64) | 0;
  }
  let tail = 0;
  switch (bytes.length & 3) {
    case 3:
      tail ^= bytes[blocks + 2] << 16;
    // falls through
    case 2:
      tail ^= bytes[blocks + 1] << 8;
    // falls through
    case 1:
      tail ^= bytes[blocks];
      hash ^= mixKey(tail);
  }
  hash ^= bytes.length;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export const toSigned = (value: number) => value | 0;
