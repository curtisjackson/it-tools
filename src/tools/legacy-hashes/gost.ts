// GOST R 34.11-94 and GOST R 34.11-2012 (Streebog), as in CyberChef (Apache-2.0) v11.5.0:
// src/core/operations/GOSTHash.mjs and Streebog.mjs, on the same vendored implementation (src/libs/gost).
import GostDigest from '@/libs/gost/gostDigest.mjs';

/** The S-boxes of GOST 28147-89: D-A is the CryptoPro set of RFC 4357, the most used. */
export const gostSBoxes = ['D-A', 'D-SC', 'D-TEST', 'E-A', 'E-B', 'E-C', 'E-D', 'E-SC', 'E-Z', 'E-TEST'] as const;
export type GostSBox = (typeof gostSBoxes)[number];

export function gost94(bytes: Uint8Array, sBox: GostSBox = 'D-A'): Uint8Array {
  if (!gostSBoxes.includes(sBox)) {
    throw new RangeError(`Unknown S-box "${sBox}"`);
  }
  return new Uint8Array(new GostDigest({ name: 'GOST 28147', version: 1994, mode: 'HASH', sBox }).digest(bytes));
}

export function streebog(bytes: Uint8Array, length: 256 | 512): Uint8Array {
  return new Uint8Array(new GostDigest({ version: 2012, mode: 'HASH', length }).digest(bytes));
}
