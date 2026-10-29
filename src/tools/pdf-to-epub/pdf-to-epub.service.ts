// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/pdf/pdf-to-epub/service.ts. Text is XML-escaped (a `&` or `<`
// in the PDF broke the XHTML), lines follow pdf.js end-of-line marks, and the title, author and language are set.
import { zipSync, strToU8 } from 'fflate';

export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
}

interface TextItem {
  str: string;
  hasEOL?: boolean;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Joins pdf.js text items into lines, and lines into paragraphs separated by empty lines. */
export function itemsToParagraphs(items: TextItem[]): string[] {
  const lines: string[] = [];
  let current = '';
  for (const item of items) {
    current += item.str;
    if (item.hasEOL) {
      lines.push(current.trim());
      current = '';
    }
  }
  lines.push(current.trim());
  const paragraphs: string[] = [];
  let paragraph: string[] = [];
  for (const line of lines) {
    if (line === '') {
      if (paragraph.length > 0) {
        paragraphs.push(paragraph.join(' '));
      }
      paragraph = [];
    } else {
      paragraph.push(line);
    }
  }
  if (paragraph.length > 0) {
    paragraphs.push(paragraph.join(' '));
  }
  return paragraphs;
}

function chapter(index: number, paragraphs: string[], language: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${escapeXml(language)}">
<head>
  <title>${index}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <style>body { font-family: serif; line-height: 1.6; margin: 1em; } p { margin: 0 0 1em; text-align: justify; }</style>
</head>
<body>
${paragraphs.map((text) => `  <p>${escapeXml(text)}</p>`).join('\n')}
</body>
</html>`;
}

/** An EPUB 2 book with one chapter per PDF page; `mimetype` is the first entry and stored, as the format requires. */
export function buildEpub(
  pages: string[][],
  { title, author, language }: EpubMetadata,
  id = `urn:uuid:${crypto.randomUUID()}`,
): Uint8Array {
  const items = pages
    .map((_, i) => `    <item id="page${i + 1}" href="page${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n');
  const spine = pages.map((_, i) => `    <itemref idref="page${i + 1}"/>`).join('\n');
  const navPoints = pages
    .map(
      (_, i) =>
        `    <navPoint id="nav${i + 1}" playOrder="${i + 1}"><navLabel><text>${i + 1}</text></navLabel><content src="page${i + 1}.xhtml"/></navPoint>`,
    )
    .join('\n');
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
    mimetype: [strToU8('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`),
    'OEBPS/content.opf': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:identifier id="bookid">${escapeXml(id)}</dc:identifier>
    <dc:language>${escapeXml(language)}</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${items}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>`),
    'OEBPS/toc.ncx': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${escapeXml(id)}"/><meta name="dtb:depth" content="1"/></head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`),
  };
  pages.forEach((paragraphs, i) => {
    files[`OEBPS/page${i + 1}.xhtml`] = strToU8(chapter(i + 1, paragraphs, language));
  });
  return zipSync(files);
}
