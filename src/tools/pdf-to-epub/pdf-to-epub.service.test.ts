import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildEpub, escapeXml, itemsToParagraphs } from './pdf-to-epub.service';

describe('pdf-to-epub', () => {
  it('joins text items into lines and paragraphs', () => {
    expect(
      itemsToParagraphs([
        { str: 'Hello', hasEOL: false },
        { str: ' world', hasEOL: true },
        { str: 'same paragraph', hasEOL: true },
        { str: '', hasEOL: true },
        { str: 'next', hasEOL: false },
      ]),
    ).toEqual(['Hello world same paragraph', 'next']);
  });

  it('escapes XML', () => {
    expect(escapeXml(`a < b & "c" > 'd'`)).toBe('a &lt; b &amp; &quot;c&quot; &gt; &apos;d&apos;');
  });

  it('builds an EPUB with mimetype first and escaped text', () => {
    const epub = buildEpub([['Tom & Jerry <3'], ['Page two']], { title: 'Q&A', author: 'Me', language: 'ru' }, 'id-1');
    expect(strFromU8(epub.subarray(30, 38))).toBe('mimetype');
    const files = unzipSync(epub);
    expect(Object.keys(files)).toEqual([
      'mimetype',
      'META-INF/container.xml',
      'OEBPS/content.opf',
      'OEBPS/toc.ncx',
      'OEBPS/page1.xhtml',
      'OEBPS/page2.xhtml',
    ]);
    expect(strFromU8(files.mimetype)).toBe('application/epub+zip');
    expect(strFromU8(files['OEBPS/content.opf'])).toContain('<dc:title>Q&amp;A</dc:title>');
    expect(strFromU8(files['OEBPS/content.opf'])).toContain('<dc:language>ru</dc:language>');
    expect(strFromU8(files['OEBPS/page1.xhtml'])).toContain('<p>Tom &amp; Jerry &lt;3</p>');
  });
});
