import { describe, expect, it } from 'vitest';
import { cmac, keyedMac } from './keyed-mac.service';
import { CMAC_VECTORS } from './keyed-mac.vectors';
import { bytesToHex, hexToBytes } from '@/utils/bytes';

describe('keyed-mac', () => {
  it.each(CMAC_VECTORS)('%s', (_, message, key, cipher, expected) => {
    expect(bytesToHex(cmac(hexToBytes(key), hexToBytes(message), cipher))).toBe(expected);
  });

  it('rejects keys of the wrong size', () => {
    const key = hexToBytes('00112233445566778899aabbccddeeff01234567');
    expect(() => cmac(key, new Uint8Array(0), 'aes')).toThrow('16, 24 or 32 bytes, not 20');
    expect(() => cmac(key, new Uint8Array(0), '3des')).toThrow('16 or 24 bytes, not 20');
    expect(() => keyedMac('ascon-mac', key, new Uint8Array(0))).toThrow('exactly 16 bytes');
  });

  it('computes Ascon-Mac', () => {
    expect(bytesToHex(keyedMac('ascon-mac', hexToBytes('000102030405060708090a0b0c0d0e0f'), new Uint8Array(0)))).toBe(
      'eac9d74bbedf8bf1eba2862b26aa6d39',
    );
  });
});
