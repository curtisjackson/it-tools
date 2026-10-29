import { gunzipSync, gzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createArchive, openArchive } from './archive-manager.service';
import { LONG_PATH, TAR_GZ, ZIP_AES, ZIP_CP866, ZIP_CRYPTO, ZIP_PLAIN } from './archive-manager.vectors';
import { isTar, readTar, writeTar } from './tar';
import { base64ToBytes } from '@/utils/bytes';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

async function contents(bytes: Uint8Array, password?: string) {
  const { entries } = await openArchive(bytes);
  const files: Record<string, string> = {};
  for (const entry of entries.filter(({ kind }) => kind === 'file')) {
    files[entry.path] = decode(await entry.read(password));
  }
  return files;
}

describe('readTar', () => {
  it.each(['gnu', 'posix', 'ustar'] as const)('reads every entry of a %s archive', (format) => {
    const entries = readTar(gunzipSync(base64ToBytes(TAR_GZ[format])));
    expect(entries.map(({ path, kind }) => [path, kind])).toEqual([
      ['hello.txt', 'file'],
      ['link.txt', 'symlink'],
      ['docs/', 'directory'],
      ['docs/привет.txt', 'file'],
      [LONG_PATH, 'file'],
    ]);
    expect(entries[1].linkTarget).toBe('hello.txt');
    expect(decode(entries[3].data)).toBe('привет\n');
    expect(decode(entries[4].data)).toBe('deep file\n');
    expect(entries[0].modified.toISOString()).toBe('2024-01-02T03:04:05.000Z');
    expect(entries[0].mode).toBe(0o644);
  });

  it('reads the v7 format, whose regular files have no type', () => {
    const entries = readTar(gunzipSync(base64ToBytes(TAR_GZ.v7)));
    expect(entries.map(({ path, kind }) => [path, kind])).toEqual([
      ['hello.txt', 'file'],
      ['docs/', 'directory'],
    ]);
  });

  it('rejects a damaged header', () => {
    const tar = gunzipSync(base64ToBytes(TAR_GZ.ustar));
    tar[0] ^= 1;
    expect(isTar(tar)).toBe(false);
    expect(() => readTar(tar)).toThrow('checksum');
  });
});

describe('writeTar', () => {
  it('round-trips long, non-ASCII and folder paths', () => {
    const modified = new Date('2024-01-02T03:04:05Z');
    const files = [
      { path: 'hello.txt', data: encode('hello\n'), modified },
      { path: 'docs/', data: new Uint8Array(), modified },
      { path: 'docs/привет.txt', data: encode('привет\n'), modified },
      { path: LONG_PATH, data: encode('deep file\n'), modified },
      { path: `${'x'.repeat(150)}.txt`, data: encode('no slash to split at'), modified },
    ];
    const tar = writeTar(files);
    expect(tar.length % 10240).toBe(0);
    expect(isTar(tar)).toBe(true);
    const entries = readTar(tar);
    expect(entries.map(({ path, kind, modified: date }) => [path, kind, date.getTime()])).toEqual(
      files.map(({ path }) => [path, path.endsWith('/') ? 'directory' : 'file', modified.getTime()]),
    );
    expect(entries.map(({ data }) => decode(data))).toEqual(files.map(({ data }) => decode(data)));
  });

  it('writes plain ustar headers when a path fits', () => {
    const tar = writeTar([{ path: LONG_PATH, data: encode('deep file\n') }]);
    expect(String.fromCharCode(tar[156])).toBe('0');
    expect(decode(tar.subarray(257, 262))).toBe('ustar');
  });
});

describe('openArchive', () => {
  it('opens a zip archive', async () => {
    const archive = await openArchive(base64ToBytes(ZIP_PLAIN));
    expect(archive.format).toBe('zip');
    expect(await contents(base64ToBytes(ZIP_PLAIN))).toEqual({ 'hello.txt': 'hello\n', 'docs/привет.txt': 'привет\n' });
  });

  it.each([
    ['ZipCrypto', ZIP_CRYPTO],
    ['AES-256', ZIP_AES],
  ])('decrypts %s entries with the password', async (_, zip) => {
    const { entries } = await openArchive(base64ToBytes(zip));
    expect(entries.every(({ encrypted }) => encrypted)).toBe(true);
    expect(decode(await entries[0].read('secret'))).toBe('hello\n');
    await expect(entries[0].read('wrong')).rejects.toThrow('Wrong password');
    await expect(entries[0].read()).rejects.toThrow('password');
  });

  it('decodes legacy filenames in the chosen code page', async () => {
    const bytes = base64ToBytes(ZIP_CP866);
    expect((await openArchive(bytes)).entries[0].path).not.toBe('отчёт.txt');
    const { entries } = await openArchive(bytes, { filenameEncoding: 'ibm866' });
    expect(entries[0].path).toBe('отчёт.txt');
    expect(decode(await entries[0].read())).toBe('cp866 name\n');
  });

  it('opens tar.gz archives', async () => {
    const archive = await openArchive(base64ToBytes(TAR_GZ.ustar));
    expect(archive.format).toBe('tar.gz');
    expect(archive.entries).toHaveLength(5);
  });

  it('names the content of a plain gzip file after the archive', async () => {
    const archive = await openArchive(gzipSync(encode('just text')), { fileName: 'notes.txt.gz' });
    expect(archive.format).toBe('gzip');
    expect(archive.entries[0].path).toBe('notes.txt');
    expect(decode(await archive.entries[0].read())).toBe('just text');
  });

  it('rejects other data', async () => {
    await expect(openArchive(encode('not an archive'))).rejects.toThrow('not a ZIP');
  });
});

describe('createArchive', () => {
  const files = [
    { path: 'hello.txt', data: encode('hello\n') },
    { path: 'docs/привет.txt', data: encode('привет\n') },
    { path: LONG_PATH, data: encode('deep file\n') },
  ];
  const expected = Object.fromEntries(files.map(({ path, data }) => [path, decode(data)]));

  it.each(['zip', 'tar', 'tar.gz'] as const)('creates a %s archive that opens again', async (format) => {
    expect(await contents(await createArchive(files, format))).toEqual(expected);
  });

  it.each(['aes', 'zip-crypto'] as const)('encrypts zip entries with %s', async (encryption) => {
    const zip = await createArchive(files, 'zip', { password: 'pa55', encryption });
    const { entries } = await openArchive(zip);
    expect(entries.every(({ encrypted }) => encrypted)).toBe(true);
    expect(await contents(zip, 'pa55')).toEqual(expected);
  });

  it('stores entries without compression at level 0', async () => {
    const data = encode('a'.repeat(1000));
    const { entries } = await openArchive(await createArchive([{ path: 'a.txt', data }], 'zip', { level: 0 }));
    expect(entries[0].compressedSize).toBe(1000);
  });
});
