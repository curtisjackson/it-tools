// CMAC ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/CMAC.mjs (NIST SP 800-38B, RFC 4493). The
// message is encrypted in one CBC pass with a zero IV instead of one cipher call per block; Ascon-Mac comes from
// src/utils/ascon.ts.
import forge from 'node-forge';
import { asconMac } from '@/utils/ascon';

export type MacAlgorithm = 'cmac-aes' | 'cmac-3des' | 'ascon-mac';

const binary = (bytes: Uint8Array) => String.fromCharCode(...bytes);

function cbcEncrypt(
  algorithm: 'AES-CBC' | '3DES-CBC',
  key: Uint8Array,
  data: Uint8Array,
  blockSize: number,
): Uint8Array {
  const cipher = forge.cipher.createCipher(algorithm, forge.util.createBuffer(binary(key)));
  cipher.start({ iv: forge.util.createBuffer(binary(new Uint8Array(blockSize))) });
  let text = '';
  for (let i = 0; i < data.length; i += 0x8000) {
    text += binary(data.subarray(i, i + 0x8000));
  }
  cipher.update(forge.util.createBuffer(text));
  // No padding: the data is already whole blocks. The types of node-forge leave out the padding callback.
  (cipher.finish as (pad: () => boolean) => boolean)(() => true);
  return Uint8Array.from(cipher.output.getBytes(), (char) => char.charCodeAt(0));
}

/** Doubles a block in GF(2^n): shifts it left by one bit, xoring Rb when the top bit falls out. */
function double(block: Uint8Array, rb: number): Uint8Array {
  const out = new Uint8Array(block.length);
  let carry = 0;
  for (let i = block.length - 1; i >= 0; i--) {
    out[i] = ((block[i] << 1) | carry) & 0xff;
    carry = block[i] >> 7;
  }
  if (block[0] & 0x80) {
    out[out.length - 1] ^= rb;
  }
  return out;
}

export function cmac(key: Uint8Array, message: Uint8Array, cipher: 'aes' | '3des'): Uint8Array {
  let algorithmKey = key;
  if (cipher === 'aes' && ![16, 24, 32].includes(key.length)) {
    throw new RangeError(`An AES key has 16, 24 or 32 bytes, not ${key.length}`);
  }
  if (cipher === '3des') {
    if (key.length !== 16 && key.length !== 24) {
      throw new RangeError(`A Triple DES key has 16 or 24 bytes, not ${key.length}`);
    }
    // Two-key Triple DES: K1 K2 K1.
    algorithmKey = key.length === 16 ? new Uint8Array([...key, ...key.subarray(0, 8)]) : key;
  }
  const algorithm = cipher === 'aes' ? 'AES-CBC' : '3DES-CBC';
  const blockSize = cipher === 'aes' ? 16 : 8;
  const rb = cipher === 'aes' ? 0x87 : 0x1b;

  const subkeyBase = cbcEncrypt(algorithm, algorithmKey, new Uint8Array(blockSize), blockSize);
  const k1 = double(subkeyBase, rb);
  const k2 = double(k1, rb);

  const blocks = Math.max(1, Math.ceil(message.length / blockSize));
  const complete = message.length > 0 && message.length % blockSize === 0;
  const data = new Uint8Array(blocks * blockSize);
  data.set(message);
  if (!complete) {
    data[message.length] = 0x80;
  }
  const subkey = complete ? k1 : k2;
  const last = (blocks - 1) * blockSize;
  for (let i = 0; i < blockSize; i++) {
    data[last + i] ^= subkey[i];
  }
  return cbcEncrypt(algorithm, algorithmKey, data, blockSize).subarray(last);
}

export function keyedMac(algorithm: MacAlgorithm, key: Uint8Array, message: Uint8Array): Uint8Array {
  switch (algorithm) {
    case 'cmac-aes':
      return cmac(key, message, 'aes');
    case 'cmac-3des':
      return cmac(key, message, '3des');
    case 'ascon-mac':
      return asconMac(key, message);
  }
}
