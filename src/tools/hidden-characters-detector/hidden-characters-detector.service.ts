// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/hidden-character-detector/service.ts and types.ts.
// Extended with the bidi isolates used by "Trojan Source" attacks, more invisible characters and tag characters; works
// by code point; ordinary line breaks and tabs are not reported as control characters.

export interface InitialValuesType {
  highlightRTL: boolean;
  showInvisibleChars: boolean;
  includeZeroWidthChars: boolean;
}

export type HiddenCategory = 'RTL Override' | 'Invisible Character' | 'Control Character';

export interface HiddenCharacter {
  char: string;
  unicode: string;
  name: string;
  category: HiddenCategory;
  /** Index in code points, from 0. */
  position: number;
  isRTL: boolean;
  isInvisible: boolean;
  isZeroWidth: boolean;
}

export interface AnalysisResult {
  originalText: string;
  hiddenCharacters: HiddenCharacter[];
  hasRTLOverride: boolean;
  hasInvisibleChars: boolean;
  hasZeroWidthChars: boolean;
  totalHiddenChars: number;
}

const BIDI_CHARS: Record<number, string> = {
  0x202e: 'Right-to-Left Override',
  0x202d: 'Left-to-Right Override',
  0x202b: 'Right-to-Left Embedding',
  0x202a: 'Left-to-Right Embedding',
  0x202c: 'Pop Directional Formatting',
  0x2066: 'Left-to-Right Isolate',
  0x2067: 'Right-to-Left Isolate',
  0x2068: 'First Strong Isolate',
  0x2069: 'Pop Directional Isolate',
  0x200f: 'Right-to-Left Mark',
  0x200e: 'Left-to-Right Mark',
  0x061c: 'Arabic Letter Mark',
};

const ZERO_WIDTH_CHARS: Record<number, string> = {
  0x200b: 'Zero Width Space',
  0x200c: 'Zero Width Non-Joiner',
  0x200d: 'Zero Width Joiner',
  0x2060: 'Word Joiner',
  0xfeff: 'Zero Width No-Break Space',
  0x2061: 'Function Application',
  0x2062: 'Invisible Times',
  0x2063: 'Invisible Separator',
  0x2064: 'Invisible Plus',
  0x00ad: 'Soft Hyphen',
  0x180e: 'Mongolian Vowel Separator',
  0x034f: 'Combining Grapheme Joiner',
};

const INVISIBLE_CHARS: Record<number, string> = {
  0x00a0: 'Non-Breaking Space',
  0x2000: 'En Quad',
  0x2001: 'Em Quad',
  0x2002: 'En Space',
  0x2003: 'Em Space',
  0x2004: 'Three-Per-Em Space',
  0x2005: 'Four-Per-Em Space',
  0x2006: 'Six-Per-Em Space',
  0x2007: 'Figure Space',
  0x2008: 'Punctuation Space',
  0x2009: 'Thin Space',
  0x200a: 'Hair Space',
  0x202f: 'Narrow No-Break Space',
  0x205f: 'Medium Mathematical Space',
  0x3000: 'Ideographic Space',
  0x2028: 'Line Separator',
  0x2029: 'Paragraph Separator',
  0x3164: 'Hangul Filler',
  0x115f: 'Hangul Choseong Filler',
  0x1160: 'Hangul Jungseong Filler',
  0xffa0: 'Halfwidth Hangul Filler',
};

const ORDINARY_WHITESPACE = new Set([0x09, 0x0a, 0x0d]);

function toUnicode(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

function getCharacterInfo(char: string, position: number): HiddenCharacter | undefined {
  const codePoint = char.codePointAt(0)!;
  const base = { char, unicode: toUnicode(codePoint), position, isRTL: false, isInvisible: false, isZeroWidth: false };

  if (BIDI_CHARS[codePoint]) {
    return { ...base, name: BIDI_CHARS[codePoint], category: 'RTL Override', isRTL: true };
  }
  if (ZERO_WIDTH_CHARS[codePoint]) {
    return {
      ...base,
      name: ZERO_WIDTH_CHARS[codePoint],
      category: 'Invisible Character',
      isInvisible: true,
      isZeroWidth: true,
    };
  }
  if (INVISIBLE_CHARS[codePoint]) {
    return { ...base, name: INVISIBLE_CHARS[codePoint], category: 'Invisible Character', isInvisible: true };
  }
  if (codePoint >= 0xe0000 && codePoint <= 0xe007f) {
    return { ...base, name: 'Tag Character', category: 'Invisible Character', isInvisible: true, isZeroWidth: true };
  }
  if ((codePoint < 0x20 && !ORDINARY_WHITESPACE.has(codePoint)) || (codePoint >= 0x7f && codePoint <= 0x9f)) {
    return { ...base, name: `Control Character (${codePoint})`, category: 'Control Character', isInvisible: true };
  }
  return undefined;
}

export function analyzeHiddenCharacters(text: string, options: InitialValuesType): AnalysisResult {
  const hiddenCharacters = Array.from(text)
    .map(getCharacterInfo)
    .filter(
      (info): info is HiddenCharacter =>
        !!info &&
        ((options.highlightRTL && info.isRTL) ||
          (options.showInvisibleChars && info.isInvisible) ||
          (options.includeZeroWidthChars && info.isZeroWidth)),
    );
  return {
    originalText: text,
    hiddenCharacters,
    hasRTLOverride: hiddenCharacters.some((c) => c.isRTL),
    hasInvisibleChars: hiddenCharacters.some((c) => c.isInvisible),
    hasZeroWidthChars: hiddenCharacters.some((c) => c.isZeroWidth),
    totalHiddenChars: hiddenCharacters.length,
  };
}

/** Replaces each found character by a visible marker such as `⟦U+200B⟧`. */
export function markHiddenCharacters(result: AnalysisResult): string {
  const found = new Map(result.hiddenCharacters.map((c) => [c.position, c]));
  return Array.from(result.originalText, (char, i) => (found.has(i) ? `⟦${found.get(i)!.unicode}⟧` : char)).join('');
}

const LINE_BREAKS = new Set([0x2028, 0x2029]);
const SPACES = new Set(
  Object.keys(INVISIBLE_CHARS)
    .map(Number)
    .filter((codePoint) => !LINE_BREAKS.has(codePoint) && ![0x3164, 0x115f, 0x1160, 0xffa0].includes(codePoint)),
);

/**
 * The text without the found characters: special spaces become ordinary spaces and line or paragraph separators
 * become line breaks, so that words do not get glued together; the others are removed.
 */
export function removeHiddenCharacters(result: AnalysisResult): string {
  const found = new Set(result.hiddenCharacters.map((c) => c.position));
  return Array.from(result.originalText, (char, i) => {
    if (!found.has(i)) {
      return char;
    }
    const codePoint = char.codePointAt(0)!;
    return SPACES.has(codePoint) ? ' ' : LINE_BREAKS.has(codePoint) ? '\n' : '';
  }).join('');
}
