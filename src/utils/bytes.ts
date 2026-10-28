// Byte conversions for the tools ported from CyberChef (Apache-2.0) v11.5.0, replacing the helpers of
// src/core/Utils.mjs they relied on (convertToByteArray, strToArrayBuffer, toHex, ...).

export type BytesFormat = 'hex' | 'base64' | 'utf8' | 'latin1';

export const bytesFormats: BytesFormat[] = ['hex', 'base64', 'utf8', 'latin1'];

/**
 * Parses hex such as `48656c6c6f`, `48 65 6c`, `48:65:6c`, `0x48,0x65` or `\x48\x65`. Throws on odd length or
 * non-hex characters.
 */
export function hexToBytes(hex: string): Uint8Array {
  const digits = hex.replace(/0x|\\x/gi, '').replace(/[\s:,;-]/g, '');
  if (/[^0-9a-f]/i.test(digits)) {
    throw new Error('Invalid hex: only 0-9 and a-f are allowed');
  }
  if (digits.length % 2 !== 0) {
    throw new Error('Invalid hex: odd number of digits');
  }
  const bytes = new Uint8Array(digits.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(digits.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array, separator = ''): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(separator);
}

/** Parses standard or URL-safe base64, with or without padding and line breaks. */
export function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (/[^A-Za-z0-9+/]/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error('Invalid base64');
  }
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** One byte per character. Throws on characters above U+00FF, which do not fit in a byte. */
export function latin1ToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0xff) {
      throw new Error(`Character "${text[i]}" at position ${i} does not fit in one byte`);
    }
    bytes[i] = code;
  }
  return bytes;
}

export function bytesToLatin1(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return text;
}

/** UTF-16 little-endian encoding, as used by Windows (e.g. for NT hashes). */
export function utf16leToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = code >> 8;
  }
  return bytes;
}

export function parseBytes(text: string, format: BytesFormat): Uint8Array {
  switch (format) {
    case 'hex':
      return hexToBytes(text);
    case 'base64':
      return base64ToBytes(text);
    case 'latin1':
      return latin1ToBytes(text);
    case 'utf8':
      return new TextEncoder().encode(text);
  }
}

export function stringifyBytes(bytes: Uint8Array, format: BytesFormat): string {
  switch (format) {
    case 'hex':
      return bytesToHex(bytes);
    case 'base64':
      return bytesToBase64(bytes);
    case 'latin1':
      return bytesToLatin1(bytes);
    case 'utf8':
      return new TextDecoder().decode(bytes);
  }
}
