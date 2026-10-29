import { describe, expect, it } from 'vitest';
import { decodeBcryptBase64, inspectHash } from './hash-inspector.service';
import { bytesToHex } from '@/utils/bytes';

// Test vectors of CyberChef (Apache-2.0) v11.5.0: tests/operations/tests/Hash.mjs.
const BCRYPT = '$2a$10$qyon0LQCmMxpFFjwWH6Qh.dDdhqntQh./IN0RXCc3XIMILuOYZKgK';
const ARGON2 = '$argon2i$v=19$m=4096,t=3,p=1$c29tZXNhbHQ$s43my9eBljQADuF/LWCG8vGqwAJzOorKQ0Yog8jFvbw';

const fields = (hash: string) => Object.fromEntries(inspectHash(hash).fields);

describe('hash-inspector', () => {
  it('parses a bcrypt hash', () => {
    const info = inspectHash(BCRYPT);
    expect(info.scheme).toBe('bcrypt');
    expect(fields(BCRYPT)).toMatchObject({
      version: '2a',
      cost: '10 (2^10 = 1,024 rounds)',
      salt: 'qyon0LQCmMxpFFjwWH6Qh.',
      hash: 'dDdhqntQh./IN0RXCc3XIMILuOYZKgK',
    });
    expect(fields(BCRYPT)['salt-bytes']).toMatch(/\(16 bytes\)$/);
    expect(fields(BCRYPT)['hash-bytes']).toMatch(/\(23 bytes\)$/);
  });

  it('checks a password against bcrypt', async () => {
    const { verify } = inspectHash(BCRYPT);
    expect(await verify?.('dolphin')).toBe(true);
    expect(await verify?.('dolphins')).toBe(false);
  });

  it('parses an Argon2 hash and checks a password', async () => {
    const info = inspectHash(ARGON2);
    expect(info.scheme).toBe('argon2i');
    expect(fields(ARGON2)).toMatchObject({
      version: '0x13 (1.3)',
      memory: '4096 KiB (4 MiB)',
      iterations: '3',
      parallelism: '1',
      'salt-bytes': '736f6d6573616c74 (8 bytes)',
    });
    expect(await info.verify?.('argon2password')).toBe(true);
    expect(await info.verify?.('wrong')).toBe(false);
  });

  it('recognises the other formats', () => {
    expect(inspectHash('$6$rounds=656000$saltsalt$abcdefghijklmnopqrstuv').scheme).toBe('sha512-crypt');
    expect(fields('$5$saltsalt$abc').rounds).toBe('5000 (default)');
    expect(inspectHash('$1$saltsalt$qjXMvbEw8oaL.CzflDugX/').scheme).toBe('md5-crypt');
    expect(inspectHash('$apr1$saltsalt$qjXMvbEw8oaL.CzflDugX/').scheme).toBe('apr1 (Apache MD5)');
    expect(inspectHash('$y$j9T$F5Jx5fExrKuPp53xLKQ..1$X3DX6M94c7o.9agCG9G317fhZg9SqC.5i5rd.RhAtQ7').scheme).toBe(
      'yescrypt',
    );
    expect(fields('pbkdf2_sha256$600000$salt$MTIzNA==')).toMatchObject({
      iterations: '600,000',
      'hash-bytes': '31323334 (4 bytes)',
    });
    expect(inspectHash(' $2b$12$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz01234 ').scheme).toBe('bcrypt');
  });

  it('decodes bcrypt Base64', () => {
    // "./" are the first two digits of the alphabet: zero bits.
    expect(bytesToHex(decodeBcryptBase64('..', 1))).toBe('00');
    expect(() => decodeBcryptBase64('a!', 1)).toThrow('Invalid bcrypt Base64 character "!"');
  });

  it('rejects unknown formats', () => {
    expect(() => inspectHash('5f4dcc3b5aa765d61d8327deb882cf99')).toThrow('Unrecognised hash format');
  });
});
