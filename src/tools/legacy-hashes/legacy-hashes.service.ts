// The rare hashes of CyberChef (Apache-2.0) v11.5.0 — src/core/operations/MD2.mjs, MD6.mjs, SHA0.mjs, HAS160.mjs,
// Snefru.mjs, Shake.mjs, MurmurHash3.mjs — in one tool, over bytes rather than text. MD2, SHA-0, HAS-160 and Snefru
// come from crypto-api (MIT), as in CyberChef, vendored in src/libs because its imports have no extensions; SHAKE from
// @noble/hashes (MIT) instead of js-sha3.
import { shake128, shake256 } from '@noble/hashes/sha3.js';
import Has160 from '@/libs/crypto-api/hasher/has160.mjs';
import Md2 from '@/libs/crypto-api/hasher/md2.mjs';
import Sha0 from '@/libs/crypto-api/hasher/sha0.mjs';
import Snefru from '@/libs/crypto-api/hasher/snefru.mjs';
import { md6 } from './md6';
import { murmurHash3 } from './murmurhash3';

export type LegacyAlgorithm = 'md2' | 'md6' | 'sha0' | 'has160' | 'snefru' | 'shake128' | 'shake256' | 'murmur3';

export const legacyAlgorithms: LegacyAlgorithm[] = [
  'md2',
  'md6',
  'sha0',
  'has160',
  'snefru',
  'shake128',
  'shake256',
  'murmur3',
];

export interface LegacyHashOptions {
  /** MD2, SHA-0, HAS-160, Snefru. */
  rounds?: number;
  /** Output size in bits: MD6, Snefru, SHAKE. */
  size?: number;
  /** MD6. */
  levels?: number;
  key?: Uint8Array;
  /** MurmurHash3. */
  seed?: number;
}

/** The defaults of CyberChef. */
export const defaultOptions: Record<LegacyAlgorithm, LegacyHashOptions> = {
  md2: { rounds: 18 },
  md6: { size: 256, levels: 64 },
  sha0: { rounds: 80 },
  has160: { rounds: 80 },
  snefru: { size: 128, rounds: 8 },
  shake128: { size: 256 },
  shake256: { size: 512 },
  murmur3: { seed: 0 },
};

type HasherClass = new (options?: Record<string, number>) => {
  update: (message: string) => void;
  finalize: () => string;
};

function cryptoApi(Hasher: HasherClass, bytes: Uint8Array, options: Record<string, number>): Uint8Array {
  const hasher = new Hasher(options);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  hasher.update(binary);
  return Uint8Array.from(hasher.finalize(), (char) => char.charCodeAt(0));
}

function checkRange(value: number, min: number, max: number, what: string) {
  if (!(Number.isInteger(value) && value >= min && value <= max)) {
    throw new RangeError(`${what} must be an integer from ${min} to ${max}`);
  }
}

export function legacyHash(algorithm: LegacyAlgorithm, bytes: Uint8Array, options: LegacyHashOptions = {}): Uint8Array {
  const { rounds, size, levels, key, seed } = { ...defaultOptions[algorithm], ...options };
  switch (algorithm) {
    case 'md2':
      checkRange(rounds!, 0, 1000, 'The number of rounds');
      return cryptoApi(Md2, bytes, { rounds: rounds! });
    case 'sha0':
      checkRange(rounds!, 16, 80, 'The number of rounds');
      return cryptoApi(Sha0, bytes, { rounds: rounds! });
    case 'has160':
      checkRange(rounds!, 1, 80, 'The number of rounds');
      return cryptoApi(Has160, bytes, { rounds: rounds! });
    case 'snefru':
      checkRange(rounds!, 2, 8, 'The number of rounds');
      if (!(size! >= 32 && size! <= 480 && size! % 32 === 0)) {
        throw new RangeError('The Snefru size is 32 to 480 bits, in steps of 32');
      }
      return cryptoApi(Snefru, bytes, { rounds: rounds!, length: size! });
    case 'md6':
      checkRange(size!, 1, 512, 'The size');
      return md6(bytes, { size, levels, key });
    case 'shake128':
    case 'shake256':
      if (!(Number.isInteger(size) && size! > 0 && size! % 8 === 0 && size! <= 65536)) {
        throw new RangeError('The SHAKE size is a positive multiple of 8 bits');
      }
      return (algorithm === 'shake128' ? shake128 : shake256)(bytes, { dkLen: size! / 8 });
    case 'murmur3': {
      const hash = murmurHash3(bytes, seed);
      return new Uint8Array([hash >>> 24, (hash >>> 16) & 0xff, (hash >>> 8) & 0xff, hash & 0xff]);
    }
  }
}
