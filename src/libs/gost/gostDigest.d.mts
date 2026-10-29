// Types of the hash mode of gostDigest.mjs, the only one used here.
export default class GostDigest {
  constructor(algorithm: { name?: string; version: 1994 | 2012; mode: 'HASH'; length?: number; sBox?: string });
  digest(data: ArrayBuffer | Uint8Array): ArrayBuffer;
}
