import { describe, expect, it } from 'vitest';
import { lmHash, ntHash } from './windows-password-hashes.service';
import { hexToBytes } from '@/utils/bytes';

// Test vectors of CyberChef (Apache-2.0) v11.5.0: tests/operations/tests/NTLM.mjs.
const PASSWORD = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890!@#$%^&*()_+.,?/';

describe('windows-password-hashes', () => {
  it('computes the NT hash', async () => {
    expect(await ntHash(PASSWORD)).toBe('C5FA1C40E55734A8E528DBFE21766D23');
    expect(await ntHash('password')).toBe('8846F7EAEE8FB117AD06BDD830B7586C');
    expect(await ntHash('')).toBe('31D6CFE0D16AE931B73C59D7E0C089C0');
  });

  it('computes the LM hash', () => {
    expect(lmHash(PASSWORD)).toEqual({ hash: '6D9DF16655336CA75A3C13DD18BA8156', truncated: true, replaced: false });
    expect(lmHash('password').hash).toBe('E52CAC67419A9A224A3B108F3FA6CB6D');
    expect(lmHash('').hash).toBe('AAD3B435B51404EEAAD3B435B51404EE');
  });

  it('upper-cases before truncating', () => {
    // "Ïß&.-+,0!%!S(*": "ß" becomes "SS" once upper-cased.
    const password = String.fromCharCode(...hexToBytes('cfdf262e2d2b2c3021252153282a'));
    expect(lmHash(password)).toEqual({ hash: '98C1A4EB163B98D8DB93DECF17002EEE', truncated: true, replaced: false });
  });

  it('flags the characters LM cannot represent', () => {
    expect(lmHash('пароль').replaced).toBe(true);
  });
});
