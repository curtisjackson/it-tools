import { describe, expect, it } from 'vitest';
import { type LegacyAlgorithm, type LegacyHashOptions, legacyHash } from './legacy-hashes.service';
import { md6 } from './md6';
import { murmurHash3, toSigned } from './murmurhash3';
import { bytesToHex } from '@/utils/bytes';

const text = (value: string) => new TextEncoder().encode(value);
const hex = (algorithm: LegacyAlgorithm, input: string, options?: LegacyHashOptions) =>
  bytesToHex(legacyHash(algorithm, text(input), options));
const HELLO = 'Hello, World!';

describe('legacy-hashes', () => {
  // Test vectors of CyberChef (Apache-2.0) v11.5.0: tests/operations/tests/Hash.mjs.
  it.each([
    ['md2', {}, '1c8f1e6a94aaa7145210bf90bb52871a'],
    ['md6', {}, 'ce5effce32637e6b8edaacc9284b873c3fd4e66f9779a79df67eb4a82dda8230'],
    ['sha0', {}, '5a5588f0407c6ae9a988758e76965f841b299229'],
    ['has160', {}, '8f6dd8d7c8a04b1cb3831adc358b1e4ac2ed5984'],
    ['shake128', {}, '2bf5e6dee6079fad604f573194ba8426bd4d30eb13e8ba2edae70e529b570cbd'],
    [
      'shake256',
      {},
      'b3be97bfd978833a65588ceae8a34cf59e95585af62063e6b89d0789f372424e8b0d1be4f21b40ce5a83a438473271e0661854f02d431db74e6904d6c347d757',
    ],
    ['snefru', { rounds: 2, size: 128 }, 'a4ad2b8848580511d0884fb4233a7e7a'],
    ['snefru', { rounds: 4, size: 128 }, 'd154eae2c9ffbcd2e1bdaf0b84736126'],
    ['snefru', { rounds: 8, size: 128 }, '6f3d55b69557abb0a3c4e9de9d29ba5d'],
    ['snefru', { rounds: 2, size: 256 }, '65736daba648de28ef4c4a316b4684584ecf9f22ddb5c457729e6bf0f40113c4'],
    ['snefru', { rounds: 4, size: 256 }, '71b0ea4b3e33f2e58bcc67c8a8de060b99ec0107355bbfdc18d8f65f0194ffcc'],
    ['snefru', { rounds: 8, size: 256 }, '255cd401414c79588cf689e8d5ff0536a2cfab83fcae36e654f202b09bc4b8a7'],
  ] as [LegacyAlgorithm, LegacyHashOptions, string][])('%s %o', (algorithm, options, expected) => {
    expect(hex(algorithm, HELLO, options)).toBe(expected);
  });

  it.each([
    ['gost94', '', '981e5f3ca30c841487830f84fb433e13ac1101569b9c13584ac483234cd656c0'],
    ['gost94', 'This is message, length=32 bytes', '2cefc2f7b7bdc514e18ea57fa74ff357e7fa17d652c75f69cb1be7893ede48eb'],
    ['streebog256', '', '3f539a213e97c802cc229d474c6aa32a825a360b2a933a949fd925208d9ce1bb'],
    [
      'streebog256',
      'The quick brown fox jumps over the lazy dog',
      '3e7dea7f2384b6c5a3d0e24aaa29c05e89ddd762145030ec22c71a6db8b2c1f4',
    ],
    [
      'streebog512',
      '',
      '8e945da209aa869f0455928529bcae4679e9873ab707b55315f56ceb98bef0a7362f715528356ee83cda5f2aac4c6ad2ba3a715c1bcd81cb8e9f90bf4c1c1a8a',
    ],
    [
      'streebog512',
      'The quick brown fox jumps over the lazy dog',
      'd2b793a0bb6cb5904828b5b6dcfb443bb8f33efc06ad09368878ae4cdc8245b97e60802469bed1e7c21a64ff0b179a6a1e0bb74d92965450a0adab69162c00fe',
    ],
  ] as [LegacyAlgorithm, string, string][])('%s %j', (algorithm, input, expected) => {
    // The GOST R 34.11-94 vectors use the CryptoPro S-box (D-A), the default.
    expect(hex(algorithm, input)).toBe(expected);
  });

  it('computes GOST R 34.11-94 with the test S-box of RFC 5831', () => {
    expect(hex('gost94', 'This is message, length=32 bytes', { sBox: 'D-TEST' })).toBe(
      'b1c466d37519b82e8319819ff32595e047a28cb6f83eff1c6916a815a637fffa',
    );
  });

  it('computes the Ascon hashes', () => {
    // Test vector of CyberChef: tests/operations/tests/Ascon.mjs.
    expect(hex('ascon-hash256', HELLO)).toBe('f40e1ce8d4272e628e9535193f196f4ff2a720b00f6380c5d6f16b975f3a7777');
    expect(hex('ascon-hash', '')).toBe('7346bc14f036e87ae03d0997913088f5f68411434b3cf8b54fa796a80d251f91');
    expect(hex('ascon-xof128', HELLO, { size: 64 })).toHaveLength(16);
    expect(() => hex('ascon-cxof128', HELLO, { size: 4 })).toThrow('multiple of 8');
  });

  it('computes MurmurHash3 like CyberChef', () => {
    // Test vectors of CyberChef: tests/operations/tests/MurmurHash3.mjs.
    expect(murmurHash3(text(''))).toBe(0);
    expect(murmurHash3(text('1'))).toBe(2484513939);
    expect(murmurHash3(text('Hello World!'))).toBe(3691591037);
    expect(murmurHash3(text('Hello World!'), 1337)).toBe(1148600031);
    expect(murmurHash3(text('foo'))).toBe(4138058784);
    expect(toSigned(murmurHash3(text('foo')))).toBe(-156908512);
    expect(hex('murmur3', 'foo')).toBe('f6a5c420');
  });

  it('hashes UTF-8 text with MurmurHash3', () => {
    // Reference value of the C++ implementation for the UTF-8 bytes of "тест".
    expect(murmurHash3(text('тест'))).toBe(
      murmurHash3(new Uint8Array([0xd1, 0x82, 0xd0, 0xb5, 0xd1, 0x81, 0xd1, 0x82])),
    );
    expect(murmurHash3(text('тест'))).not.toBe(murmurHash3(new Uint8Array([0x42, 0x35, 0x41, 0x42])));
  });

  it('follows the MD6 reference values', () => {
    // Values of the MD6 reference implementation (md6sum) for "abc".
    expect(bytesToHex(md6(text('abc'), { size: 256 }))).toBe(
      '230637d4e6845cf0d092b558e87625f03881dd53a7439da34cf3b94ed0d8b2c5',
    );
    expect(bytesToHex(md6(text('abc'), { size: 512 }))).toBe(
      '00918245271e377a7ffb202b90f3bda5477d8feab12d8a3a8994ebc55fe6e74ca8341520032eeea3fdef892f2882378f636212af4b2683ccf80bf025b7d9b457',
    );
  });

  it('hashes with an MD6 key and fewer levels', () => {
    const keyed = bytesToHex(md6(text(HELLO), { key: text('key') }));
    expect(keyed).not.toBe(hex('md6', HELLO));
    expect(bytesToHex(md6(text(HELLO), { levels: 0 }))).toHaveLength(64);
    expect(bytesToHex(md6(text(HELLO), { size: 12 }))).toMatch(/^[0-9a-f]{3}0$/);
  });

  it('checks the options', () => {
    expect(() => hex('snefru', HELLO, { size: 100 })).toThrow('32 to 480');
    expect(() => hex('sha0', HELLO, { rounds: 10 })).toThrow('from 16 to 80');
    expect(() => hex('shake128', HELLO, { size: 12 })).toThrow('multiple of 8');
    expect(() => hex('md6', HELLO, { size: 0 })).toThrow('from 1 to 512');
    expect(hex('shake256', HELLO, { size: 64 })).toBe('b3be97bfd978833a');
  });
});
