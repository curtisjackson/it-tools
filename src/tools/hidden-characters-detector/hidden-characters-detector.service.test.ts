// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/hidden-character-detector (the text report
// function is not ported).
import { describe, expect, it } from 'vitest';
import {
  type InitialValuesType,
  analyzeHiddenCharacters,
  markHiddenCharacters,
  removeHiddenCharacters,
} from './hidden-characters-detector.service';

describe('Hidden Character Detector', () => {
  const defaultOptions: InitialValuesType = {
    highlightRTL: true,
    showInvisibleChars: true,
    includeZeroWidthChars: true,
  };

  describe('analyzeHiddenCharacters', () => {
    it('should detect RTL Override characters', () => {
      const text = 'Hello\u202EWorld'; // RTL Override
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.totalHiddenChars).toBe(1);
      expect(result.hasRTLOverride).toBe(true);
      expect(result.hiddenCharacters[0].isRTL).toBe(true);
      expect(result.hiddenCharacters[0].unicode).toBe('U+202E');
      expect(result.hiddenCharacters[0].name).toBe('Right-to-Left Override');
    });

    it('should detect invisible characters', () => {
      const text = 'Hello\u200BWorld'; // Zero Width Space
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.totalHiddenChars).toBe(1);
      expect(result.hasInvisibleChars).toBe(true);
      expect(result.hiddenCharacters[0].isInvisible).toBe(true);
      expect(result.hiddenCharacters[0].unicode).toBe('U+200B');
      expect(result.hiddenCharacters[0].name).toBe('Zero Width Space');
    });

    it('should detect zero-width characters', () => {
      const text = 'Hello\u200CWorld'; // Zero Width Non-Joiner
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.totalHiddenChars).toBe(1);
      expect(result.hasZeroWidthChars).toBe(true);
      expect(result.hiddenCharacters[0].isZeroWidth).toBe(true);
      expect(result.hiddenCharacters[0].unicode).toBe('U+200C');
    });

    it('should detect multiple hidden characters', () => {
      const text = 'Hello\u202E\u200BWorld'; // RTL Override + Zero Width Space
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.totalHiddenChars).toBe(2);
      expect(result.hasRTLOverride).toBe(true);
      expect(result.hasInvisibleChars).toBe(true);
      expect(result.hasZeroWidthChars).toBe(true);
    });

    it('should detect control characters', () => {
      const text = 'Hello\u0000World'; // Null character
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.totalHiddenChars).toBe(1);
      expect(result.hiddenCharacters[0].category).toBe('Control Character');
      expect(result.hiddenCharacters[0].isInvisible).toBe(true);
    });

    it('should not detect regular characters', () => {
      const text = 'Hello World';
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.totalHiddenChars).toBe(0);
      expect(result.hasRTLOverride).toBe(false);
      expect(result.hasInvisibleChars).toBe(false);
      expect(result.hasZeroWidthChars).toBe(false);
    });

    it('should filter based on options', () => {
      const text = 'Hello\u202E\u200BWorld';
      const options: InitialValuesType = {
        ...defaultOptions,
        highlightRTL: false,
        showInvisibleChars: true,
      };

      const result = analyzeHiddenCharacters(text, options);

      expect(result.totalHiddenChars).toBe(1); // Only invisible chars
      expect(result.hasRTLOverride).toBe(false);
      expect(result.hasInvisibleChars).toBe(true);
    });

    it('should provide correct character positions', () => {
      const text = 'Hello\u202EWorld';
      const result = analyzeHiddenCharacters(text, defaultOptions);

      expect(result.hiddenCharacters[0].position).toBe(5);
      expect(result.hiddenCharacters[0].char).toBe('\u202E');
    });
  });
});

describe('hidden characters, extensions', () => {
  const all: InitialValuesType = { highlightRTL: true, showInvisibleChars: true, includeZeroWidthChars: true };

  it('detects bidi isolates used by Trojan Source', () => {
    const result = analyzeHiddenCharacters('if (isAdmin) {⁧ } ⁦if (x)', all);
    expect(result.hiddenCharacters.map((c) => c.unicode)).toEqual(['U+2067', 'U+2066']);
    expect(result.hasRTLOverride).toBe(true);
  });

  it('does not report line breaks and tabs', () => {
    expect(analyzeHiddenCharacters('a\tb\r\nc', all).totalHiddenChars).toBe(0);
  });

  it('detects soft hyphens, Hangul fillers and tag characters, by code point', () => {
    const result = analyzeHiddenCharacters('😀­xㅤ\u{E0041}', all);
    expect(result.hiddenCharacters.map((c) => [c.position, c.name])).toEqual([
      [1, 'Soft Hyphen'],
      [3, 'Hangul Filler'],
      [4, 'Tag Character'],
    ]);
  });

  it('marks and removes the found characters', () => {
    const result = analyzeHiddenCharacters('pass​word‮', all);
    expect(markHiddenCharacters(result)).toBe('pass⟦U+200B⟧word⟦U+202E⟧');
    expect(removeHiddenCharacters(result)).toBe('password');
  });

  it('turns special spaces into spaces and separators into line breaks when cleaning', () => {
    const result = analyzeHiddenCharacters('a\u00A0b\u3000c\u2028d\u3164e', all);
    expect(removeHiddenCharacters(result)).toBe('a b c\nde');
  });
});
