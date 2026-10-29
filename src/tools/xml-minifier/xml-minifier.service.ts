// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/XMLMinify.mjs, on `xml-formatter` instead of
// `vkbeautify`: the XML is parsed, so invalid input is reported, and the text inside the elements is kept as is.
import xmlFormat from 'xml-formatter';

export interface XmlMinifyOptions {
  preserveComments: boolean;
  /** Writes `<a></a>` as `<a/>`. */
  selfCloseEmpty: boolean;
}

export function minifyXml(xml: string, { preserveComments, selfCloseEmpty }: XmlMinifyOptions): string {
  if (!xml.trim()) {
    return '';
  }
  return xmlFormat.minify(xml.trim(), {
    filter: preserveComments ? undefined : (node) => node.type !== 'Comment',
    forceSelfClosingEmptyTag: selfCloseEmpty,
    strictMode: true,
  });
}
