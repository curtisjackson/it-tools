import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { deduplicateFileNames, replaceExtension, zipFiles } from './file-output';

describe('file-output', () => {
  it('replaceExtension replaces or adds the extension', () => {
    expect(replaceExtension('clip.mov', 'mp4')).toBe('clip.mp4');
    expect(replaceExtension('archive.tar.gz', '.zip')).toBe('archive.tar.zip');
    expect(replaceExtension('README', 'txt')).toBe('README.txt');
    expect(replaceExtension('.env', 'txt')).toBe('.env.txt');
  });

  it('deduplicateFileNames numbers repeated names', () => {
    expect(deduplicateFileNames(['a.png', 'b.png', 'a.png', 'a.png', 'a'])).toEqual([
      'a.png',
      'b.png',
      'a (1).png',
      'a (2).png',
      'a',
    ]);
  });

  it('zipFiles builds an archive that unzips to the same files', async () => {
    const files = [
      new File(['hello'], 'page.txt', { type: 'text/plain' }),
      new File([new Uint8Array([1, 2, 3])], 'page.txt', { type: 'image/png' }),
    ];

    const zip = await zipFiles(files);
    const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()));

    expect(zip.type).toBe('application/zip');
    expect(Object.keys(entries)).toEqual(['page.txt', 'page (1).txt']);
    expect(new TextDecoder().decode(entries['page.txt'])).toBe('hello');
    expect(entries['page (1).txt']).toEqual(new Uint8Array([1, 2, 3]));
  });
});
