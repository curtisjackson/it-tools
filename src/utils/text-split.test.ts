import { describe, expect, it } from 'vitest';
import { joinWith, splitBy, unescapeSeparator } from './text-split';

describe('text-split', () => {
  describe('unescapeSeparator', () => {
    it('turns typed escape sequences into characters', () => {
      expect(unescapeSeparator('\\n')).toBe('\n');
      expect(unescapeSeparator('\\t|\\r')).toBe('\t|\r');
      expect(unescapeSeparator(', ')).toBe(', ');
    });
  });

  describe('splitBy', () => {
    it('splits by a symbol', () => {
      expect(splitBy('a,b,,c', { splitOperatorType: 'symbol', splitSeparator: ',' })).toEqual(['a', 'b', '', 'c']);
    });

    it('splits by an escaped symbol', () => {
      expect(splitBy('a\nb', { splitOperatorType: 'symbol', splitSeparator: '\\n' })).toEqual(['a', 'b']);
    });

    it('splits by a regex', () => {
      expect(splitBy('a1b22c', { splitOperatorType: 'regex', splitSeparator: '\\d+' })).toEqual(['a', 'b', 'c']);
    });

    it('does not treat a symbol as a regex', () => {
      expect(splitBy('a.b', { splitOperatorType: 'symbol', splitSeparator: '.' })).toEqual(['a', 'b']);
      expect(splitBy('a+b', { splitOperatorType: 'symbol', splitSeparator: '+' })).toEqual(['a', 'b']);
    });

    it('throws on an invalid regex', () => {
      expect(() => splitBy('a', { splitOperatorType: 'regex', splitSeparator: '(' })).toThrow();
    });
  });

  describe('joinWith', () => {
    it('joins with an escaped separator', () => {
      expect(joinWith(['a', 'b'], '\\n')).toBe('a\nb');
      expect(joinWith(['a', 'b'], ' - ')).toBe('a - b');
    });
  });
});
