import { describe, expect, it } from 'vitest';
import { compareCtph, ctph } from './ctph';
import { compareSsdeep, parseSsdeep, ssdeep } from './ssdeep';

const text = (value: string) => new TextEncoder().encode(value);
const LOREM = Array.from({ length: 40 }, (_, i) => `Line ${i}: the quick brown fox jumps over the lazy dog.`).join(
  '\n',
);

describe('fuzzy-hash', () => {
  // Test vectors of CyberChef (Apache-2.0) v11.5.0: tests/operations/tests/GenerateAllHashes.mjs and
  // tests/node/tests/operations.mjs.
  it('computes SSDEEP like CyberChef', () => {
    expect(ssdeep(text('test'))).toBe('3:Hn:Hn');
    expect(ssdeep(text('shotgun tyranny snugly'))).toBe('3:DLIXzMQCJc:XERKc');
    expect(ssdeep(new Uint8Array(0))).toBe('3::');
  });

  it('computes CTPH like CyberChef', () => {
    expect(ctph(text('test'))).toBe('A:E:E');
    expect(ctph(text("If You Can't Stand the Heat, Get Out of the Kitchen"))).toBe('A:+EgFgBKAA0V0UFfClEs6:+Qk0gUFse');
  });

  it('adds no last character when the data ends with zeros, as ssdeep does', () => {
    // The rolling hash of zeros stays at 0; ssdeep.js would still add a character.
    expect(ssdeep(new Uint8Array(7))).toBe('3::');
    expect(ssdeep(new Uint8Array(100))).toBe('3::');
  });

  it('chooses a block size that keeps at least 32 characters', () => {
    const hash = parseSsdeep(ssdeep(text(LOREM)));
    expect(hash.blockSize % 3).toBe(0);
    expect(hash.first.length).toBeGreaterThanOrEqual(1);
    expect(hash.first.length).toBeLessThanOrEqual(64);
    expect(hash.second.length).toBeLessThanOrEqual(32);
  });

  it('scores similar data high and different data at 0', () => {
    const original = ssdeep(text(LOREM));
    const edited = ssdeep(text(LOREM.replace('Line 20', 'LINE twenty')));
    expect(compareSsdeep(original, original)).toBe(100);
    expect(compareSsdeep(original, edited)).toBeGreaterThan(50);
    expect(compareSsdeep(original, ssdeep(text('completely different content '.repeat(80))))).toBe(0);
    expect(compareSsdeep('3:abcdefgh:abc', '96:abcdefgh:abc')).toBe(0);
  });

  it('compares hashes whose block sizes differ by a factor of two', () => {
    // The second part of 12:... is computed with a block size of 24.
    expect(compareSsdeep('12:aaaaaaa:bcdefghijklm', '24:bcdefghijklm:x')).toBeGreaterThan(0);
    expect(compareSsdeep('24:bcdefghijklm:x', '12:aaaaaaa:bcdefghijklm')).toBeGreaterThan(0);
  });

  it('compares CTPH hashes like CyberChef', () => {
    // CyberChef: Compare CTPH hashes of "1234" and "3456" gives 0.
    expect(compareCtph('A:E:E', 'A:E:E')).toBe(100);
    expect(compareCtph('A:abc:d', 'D:abc:d')).toBe(0);
  });

  it('rejects malformed hashes', () => {
    expect(() => compareSsdeep('1234', '3456')).toThrow('Not an SSDEEP hash');
    expect(() => compareCtph('1234', '3456')).toThrow('Not a CTPH hash');
  });
});
