import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesFormats,
  bytesToBase64,
  bytesToHex,
  bytesToLatin1,
  stringifyBytes,
  hexToBytes,
  latin1ToBytes,
  parseBytes,
  utf16leToBytes,
} from './bytes';

const hello = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

describe('bytes', () => {
  describe('hexToBytes', () => {
    it('parses plain and delimited hex', () => {
      expect(hexToBytes('48656c6c6f')).toEqual(hello);
      expect(hexToBytes('48 65 6C 6c\n6f')).toEqual(hello);
      expect(hexToBytes('48:65:6c:6c:6f')).toEqual(hello);
      expect(hexToBytes('0x48, 0x65,0x6c,0x6c,0x6f')).toEqual(hello);
      expect(hexToBytes('\\x48\\x65\\x6c\\x6c\\x6f')).toEqual(hello);
      expect(hexToBytes('')).toEqual(new Uint8Array());
    });

    it('rejects invalid hex', () => {
      expect(() => hexToBytes('486')).toThrow('odd');
      expect(() => hexToBytes('zz')).toThrow('Invalid hex');
    });
  });

  it('bytesToHex', () => {
    expect(bytesToHex(hello)).toBe('48656c6c6f');
    expect(bytesToHex(new Uint8Array([0, 255]), ' ')).toBe('00 ff');
  });

  describe('base64ToBytes', () => {
    it('parses standard, url-safe and unpadded base64', () => {
      expect(base64ToBytes('SGVsbG8=')).toEqual(hello);
      expect(base64ToBytes('SGVs\nbG8')).toEqual(hello);
      expect(base64ToBytes('-_8')).toEqual(new Uint8Array([0xfb, 0xff]));
    });

    it('rejects invalid base64', () => {
      expect(() => base64ToBytes('SGV$')).toThrow('Invalid base64');
      expect(() => base64ToBytes('S')).toThrow('Invalid base64');
    });
  });

  it('bytesToBase64 handles large inputs', () => {
    const big = new Uint8Array(100_000).fill(0x41);
    expect(base64ToBytes(bytesToBase64(big))).toEqual(big);
    expect(bytesToBase64(hello)).toBe('SGVsbG8=');
  });

  it('latin1 round-trips bytes and rejects wide characters', () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(latin1ToBytes(bytesToLatin1(all))).toEqual(all);
    expect(() => latin1ToBytes('Ж')).toThrow('does not fit');
  });

  it('utf16leToBytes', () => {
    expect(utf16leToBytes('aЖ')).toEqual(new Uint8Array([0x61, 0x00, 0x16, 0x04]));
  });

  it('parseBytes and stringifyBytes are inverse for every format', () => {
    expect(parseBytes('Привет', 'utf8')).toEqual(new TextEncoder().encode('Привет'));
    for (const format of bytesFormats) {
      expect(parseBytes(stringifyBytes(hello, format), format)).toEqual(hello);
    }
  });
});
