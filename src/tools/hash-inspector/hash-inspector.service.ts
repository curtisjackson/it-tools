// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/BcryptParse.mjs and Argon2Compare.mjs. Extended to
// recognise the other common password hash formats (crypt(3) schemes, Django PBKDF2, scrypt) and show their
// parameters; bcrypt and Argon2 hashes can be checked against a password.
import { argon2Verify } from 'hash-wasm';
import { compare } from 'bcryptjs';
import { base64ToBytes, bytesToHex } from '@/utils/bytes';

export interface HashInfo {
  /** A short identifier, e.g. `bcrypt` or `argon2id`. */
  scheme: string;
  fields: [key: string, value: string][];
  verify?: (password: string) => Promise<boolean>;
}

const BCRYPT_ALPHABET = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Decodes bcrypt's own Base64 alphabet (no padding) into `length` bytes. */
export function decodeBcryptBase64(text: string, length: number): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    const value = BCRYPT_ALPHABET.indexOf(char);
    if (value < 0) {
      throw new Error(`Invalid bcrypt Base64 character "${char}"`);
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes.slice(0, length));
}

/** PHC strings use Base64 without padding. */
const phcBase64 = (text: string) => base64ToBytes(text + '='.repeat((4 - (text.length % 4)) % 4));

function bytesField(label: string, bytes: Uint8Array): [string, string] {
  return [label, `${bytesToHex(bytes)} (${bytes.length} bytes)`];
}

function formatKib(kib: number): string {
  return kib >= 1024 && kib % 1024 === 0 ? `${kib} KiB (${kib / 1024} MiB)` : `${kib} KiB`;
}

const parsers: ((hash: string) => HashInfo | undefined)[] = [
  (hash) => {
    const match = /^\$(2[abxy]?)\$(\d{2})\$([./A-Za-z0-9]{22})([./A-Za-z0-9]{31})$/.exec(hash);
    if (!match) {
      return undefined;
    }
    const [, version, cost, salt, digest] = match;
    return {
      scheme: 'bcrypt',
      fields: [
        ['version', version],
        ['cost', `${Number(cost)} (2^${Number(cost)} = ${(2 ** Number(cost)).toLocaleString('en-US')} rounds)`],
        ['salt', salt],
        bytesField('salt-bytes', decodeBcryptBase64(salt, 16)),
        ['hash', digest],
        bytesField('hash-bytes', decodeBcryptBase64(digest, 23)),
      ],
      verify: (password) => compare(password, hash),
    };
  },
  (hash) => {
    const match =
      /^\$(argon2(?:id|i|d))\$(?:v=(\d+)\$)?m=(\d+),t=(\d+),p=(\d+)(?:,[^$]*)?\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(
        hash,
      );
    if (!match) {
      return undefined;
    }
    const [, type, version = '16', memory, iterations, parallelism, salt, digest] = match;
    const versions: Record<string, string> = { 16: '0x10 (1.0)', 19: '0x13 (1.3)' };
    return {
      scheme: type,
      fields: [
        ['version', versions[version] ?? version],
        ['memory', formatKib(Number(memory))],
        ['iterations', iterations],
        ['parallelism', parallelism],
        bytesField('salt-bytes', phcBase64(salt)),
        bytesField('hash-bytes', phcBase64(digest)),
      ],
      verify: (password) => argon2Verify({ password, hash }),
    };
  },
  (hash) => {
    const match = /^\$([56])\$(?:rounds=(\d+)\$)?([^$]{0,16})\$([./A-Za-z0-9]+)$/.exec(hash);
    if (!match) {
      return undefined;
    }
    const [, id, rounds, salt, digest] = match;
    return {
      scheme: id === '5' ? 'sha256-crypt' : 'sha512-crypt',
      fields: [
        ['rounds', rounds ?? '5000 (default)'],
        ['salt', salt],
        ['hash', digest],
      ],
    };
  },
  (hash) => {
    const match = /^\$(1|apr1)\$([^$]{0,8})\$([./A-Za-z0-9]{22})$/.exec(hash);
    return match
      ? {
          scheme: match[1] === '1' ? 'md5-crypt' : 'apr1 (Apache MD5)',
          fields: [
            ['salt', match[2]],
            ['hash', match[3]],
          ],
        }
      : undefined;
  },
  (hash) => {
    const match = /^\$(y|gy|7)\$([^$]+)\$([^$]*)\$([^$]+)$/.exec(hash) ?? /^\$(7)\$(.+)$/.exec(hash);
    if (!match) {
      return undefined;
    }
    const names: Record<string, string> = { y: 'yescrypt', gy: 'gost-yescrypt', 7: 'scrypt' };
    return { scheme: names[match[1]], fields: [['parameters', match[2]]] };
  },
  (hash) => {
    const match = /^pbkdf2_(sha\d+)\$(\d+)\$([^$]+)\$([A-Za-z0-9+/=]+)$/.exec(hash);
    return match
      ? {
          scheme: `Django PBKDF2-${match[1].toUpperCase()}`,
          fields: [
            ['iterations', Number(match[2]).toLocaleString('en-US')],
            ['salt', match[3]],
            bytesField('hash-bytes', base64ToBytes(match[4])),
          ],
        }
      : undefined;
  },
  (hash) => {
    const match = /^\$(pbkdf2(?:-sha\d+)?)\$(\d+)\$([./A-Za-z0-9]+)\$([./A-Za-z0-9]+)$/.exec(hash);
    return match
      ? {
          scheme: match[1],
          fields: [
            ['iterations', Number(match[2]).toLocaleString('en-US')],
            ['salt', match[3]],
            ['hash', match[4]],
          ],
        }
      : undefined;
  },
];

export function inspectHash(input: string): HashInfo {
  const hash = input.trim();
  for (const parse of parsers) {
    const info = parse(hash);
    if (info) {
      return info;
    }
  }
  throw new Error('Unrecognised hash format');
}
