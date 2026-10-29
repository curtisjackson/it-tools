import { describe, expect, it } from 'vitest';
import { minifyXml } from './xml-minifier.service';

const xml = `<?xml version="1.0"?>
<!-- top -->
<root a="1"   b="2">
  <!-- inner -->
  <item>  text  with  spaces </item>
  <empty></empty>
  <![CDATA[ a < b ]]>
  <mixed>Hello <b>world</b> !</mixed>
</root>`;
const defaults = { preserveComments: false, selfCloseEmpty: false };

describe('xml-minifier', () => {
  it('removes the whitespace between the tags and the comments', () => {
    expect(minifyXml(xml, defaults)).toBe(
      '<?xml version="1.0"?><root a="1" b="2"><item>  text  with  spaces </item><empty></empty><![CDATA[ a < b ]]><mixed>Hello <b>world</b> !</mixed></root>',
    );
  });

  it('keeps the comments when asked', () => {
    expect(minifyXml(xml, { ...defaults, preserveComments: true })).toContain(
      '<!-- top --><root a="1" b="2"><!-- inner -->',
    );
  });

  it('self-closes the empty elements when asked', () => {
    expect(minifyXml('<a>\n  <b></b>\n</a>', { ...defaults, selfCloseEmpty: true })).toBe('<a><b/></a>');
  });

  it('rejects invalid XML and ignores an empty input', () => {
    expect(() => minifyXml('<a><b></a>', defaults)).toThrow();
    expect(minifyXml('  ', defaults)).toBe('');
  });
});
