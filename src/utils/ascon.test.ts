import { describe, expect, it } from 'vitest';
import { asconHash, asconMac } from './ascon';
import { bytesToHex, hexToBytes } from './bytes';

const text = (value: string) => new TextEncoder().encode(value);
const hex = (bytes: Uint8Array) => bytesToHex(bytes);

describe('ascon', () => {
  it('computes Ascon-Hash256 (NIST SP 800-232)', () => {
    // Test vectors of CyberChef (Apache-2.0) v11.5.0: tests/operations/tests/Ascon.mjs.
    expect(hex(asconHash(new Uint8Array(0)))).toBe('0b3be5850f2f6b98caf29f8fdea89b64a1fa70aa249b8f839bd53baa304d92b2');
    expect(hex(asconHash(text('P')))).toBe('b96da347d720272533a87f5a94a356155f49cdf7c0c10a3e6f346d8a2293e480');
    expect(hex(asconHash(text('Hello')))).toBe('c1beebe1251d562c4526d6b947cefb932998499424f6cd186e764aa0a36cddb7');
    expect(hex(asconHash(text('Hello, World!')))).toBe(
      'f40e1ce8d4272e628e9535193f196f4ff2a720b00f6380c5d6f16b975f3a7777',
    );
  });

  it('computes the Ascon v1.2 hashes', () => {
    // LWC known-answer values of Ascon v1.2 for the empty message.
    expect(hex(asconHash(new Uint8Array(0), 'Ascon-Hash'))).toBe(
      '7346bc14f036e87ae03d0997913088f5f68411434b3cf8b54fa796a80d251f91',
    );
    expect(hex(asconHash(new Uint8Array(0), 'Ascon-Hasha'))).toBe(
      'aecd027026d0675f9de7a8ad8ccf512db64b1edcf0b20c388a0c7cc617aaa2c4',
    );
  });

  it('computes Ascon-XOF128 and Ascon-CXOF128 of any length', () => {
    const xof = asconHash(text('abc'), 'Ascon-XOF128', { length: 64 });
    expect(xof).toHaveLength(64);
    expect(hex(asconHash(text('abc'), 'Ascon-XOF128', { length: 16 }))).toBe(hex(xof.subarray(0, 16)));
    const custom = asconHash(text('abc'), 'Ascon-CXOF128', { length: 32, customization: text('app') });
    expect(hex(custom)).not.toBe(hex(asconHash(text('abc'), 'Ascon-CXOF128', { length: 32 })));
    expect(hex(custom)).not.toBe(hex(xof.subarray(0, 32)));
    expect(() => asconHash(text('abc'), 'Ascon-XOF128', { length: 0 })).toThrow('positive');
  });

  it('computes Ascon-Mac', () => {
    // NIST KAT values from CyberChef's tests, key 000102...0f.
    const key = hexToBytes('000102030405060708090a0b0c0d0e0f');
    expect(hex(asconMac(key, new Uint8Array(0)))).toBe('eac9d74bbedf8bf1eba2862b26aa6d39');
    expect(hex(asconMac(key, hexToBytes('10')))).toBe('e5be5b6dfb7b0e3eae00a070791947a8');
    expect(hex(asconMac(key, hexToBytes('10111213')))).toBe('727f6386405a52ad7ca0669a6a885294');
    expect(() => asconMac(new Uint8Array(8), new Uint8Array(0))).toThrow('exactly 16 bytes, not 8');
  });
});
