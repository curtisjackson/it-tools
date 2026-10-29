// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/NTHash.mjs and LMHash.mjs. The LM hash is computed
// here (CyberChef used the `ntlm` package, which has no license): the password is upper-cased before being cut to 14
// characters, as in CyberChef's fix for characters such as "ß" that grow when upper-cased.
import forge from 'node-forge';
import { md4 } from 'hash-wasm';
import { bytesToHex } from '@/utils/bytes';

export const LM_MAX_LENGTH = 14;

/** UTF-16LE bytes of a string, by code unit as Windows does. */
export function utf16le(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = code >> 8;
  }
  return bytes;
}

export async function ntHash(password: string): Promise<string> {
  return (await md4(utf16le(password))).toUpperCase();
}

/** Spreads 7 bytes over the 8 bytes of a DES key, 7 bits per byte (the parity bit is left at 0). */
export function desKey(bytes: Uint8Array): Uint8Array {
  const key = new Uint8Array(8);
  key[0] = bytes[0];
  for (let i = 1; i < 7; i++) {
    key[i] = ((bytes[i - 1] << (8 - i)) | (bytes[i] >> i)) & 0xff;
  }
  key[7] = (bytes[6] << 1) & 0xff;
  return key;
}

function desEncrypt(key: Uint8Array, data: string): string {
  const cipher = forge.cipher.createCipher('DES-ECB', forge.util.createBuffer(String.fromCharCode(...key)));
  cipher.start();
  cipher.update(forge.util.createBuffer(data));
  cipher.finish();
  // The first block only: the rest is PKCS#7 padding.
  return cipher.output.getBytes().slice(0, 8);
}

export interface LmResult {
  hash: string;
  /** The password was longer than 14 characters once upper-cased, and was cut. */
  truncated: boolean;
  /** Characters outside Latin-1, which LM cannot represent: they are replaced by "?". */
  replaced: boolean;
}

export function lmHash(password: string): LmResult {
  const upper = password.toUpperCase();
  const text = upper.slice(0, LM_MAX_LENGTH);
  const bytes = new Uint8Array(LM_MAX_LENGTH);
  let replaced = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    replaced ||= code > 0xff;
    bytes[i] = code > 0xff ? 0x3f : code;
  }
  const magic = 'KGS!@#$%';
  const digest = desEncrypt(desKey(bytes.subarray(0, 7)), magic) + desEncrypt(desKey(bytes.subarray(7)), magic);
  return {
    hash: bytesToHex(Uint8Array.from(digest, (char) => char.charCodeAt(0))).toUpperCase(),
    truncated: upper.length > LM_MAX_LENGTH,
    replaced,
  };
}
