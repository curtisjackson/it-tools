import { describe, expect, it } from 'vitest';
import { embedpdfRussian } from './embedpdf-translations';
import { embedpdfLocale } from './pdf-editor.service';

// vite-plugin-node-polyfills replaces the node modules imported by name.
const node = (globalThis as any)['pro' + 'cess'].getBuiltinModule as (name: string) => any;

/** The English strings of the viewer, read from its bundle: the snippet does not load outside a browser. */
function englishStrings(): Record<string, unknown> {
  const { createRequire } = node('module');
  const { readdirSync, readFileSync } = node('fs');
  const { dirname, join } = node('path');
  const viewer = createRequire(import.meta.url).resolve('@embedpdf/vue-pdf-viewer');
  const snippet = createRequire(viewer).resolve('@embedpdf/snippet');
  const bundle = readdirSync(dirname(snippet)).find((name: string) => /^embedpdf-.*\.js$/.test(name));
  const source: string = readFileSync(join(dirname(snippet), bundle), 'utf8');
  const start = source.indexOf('{code:"en",name:"English",translations:{search:');
  let depth = 0;
  let end = start;
  let quote = '';
  for (; end < source.length; end++) {
    const char = source[end];
    if (quote) {
      if (char === '\\') {
        end++;
      } else if (char === quote) {
        quote = '';
      }
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      break;
    }
  }
  const json = source.slice(start, end + 1).replace(/([{,])([A-Za-z_$][\w$]*):/g, '$1"$2":');
  return JSON.parse(json).translations;
}

function keys(dictionary: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(dictionary).flatMap(([key, value]) =>
    typeof value === 'object' && value
      ? keys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('pdf-editor', () => {
  it('translates every string of the viewer, with its parameters', () => {
    const english = englishStrings();
    expect(keys(embedpdfRussian).sort()).toEqual(keys(english).sort());

    const value = (dictionary: Record<string, unknown>, key: string) =>
      key.split('.').reduce<any>((node, part) => node[part], dictionary) as string;
    for (const key of keys(english)) {
      const params = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
      expect(params(value(embedpdfRussian, key)), key).toEqual(params(value(english, key)));
    }
  });

  it('maps the app locale to a locale of the viewer', () => {
    expect(embedpdfLocale('ru')).toBe('ru');
    expect(embedpdfLocale('en')).toBe('en');
    expect(embedpdfLocale('de')).toBe('de');
    expect(embedpdfLocale('zh')).toBe('zh-CN');
    expect(embedpdfLocale('zh-TW')).toBe('zh-TW');
    expect(embedpdfLocale('pt')).toBe('pt-BR');
    expect(embedpdfLocale('uk')).toBe('en');
  });
});
