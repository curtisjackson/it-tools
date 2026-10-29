// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/reverse/reverse.service.test.ts
import { describe, expect, it } from 'vitest';
import { reverseText } from './text-reverse.service';

const options = (multiLine: boolean, skipEmptyLines: boolean, trim: boolean) => ({ multiLine, skipEmptyLines, trim });

describe('text-reverse', () => {
  it('reverses a single-line string', () => {
    expect(reverseText('hello world', options(false, false, false))).toBe('dlrow olleh');
  });

  it('reverses each line in a multi-line string', () => {
    expect(reverseText('hello\nworld', options(true, false, false))).toBe('olleh\ndlrow');
  });

  it('removes empty lines when asked', () => {
    expect(reverseText('hello\n\nworld', options(true, true, false))).toBe('olleh\ndlrow');
  });

  it('trims each line when asked', () => {
    expect(reverseText('  hello  \n  world  ', options(true, false, true))).toBe('olleh\ndlrow');
  });

  it('handles empty input', () => {
    expect(reverseText('', options(false, false, false))).toBe('');
  });

  it('handles a single line with empty lines skipped and trim', () => {
    expect(reverseText('  hello world  ', options(false, true, true))).toBe('dlrow olleh');
  });

  it('keeps surrounding spaces without trim', () => {
    expect(reverseText('  hello world  ', options(false, true, false))).toBe('  dlrow olleh  ');
    expect(reverseText('  hello\n\n\n\nworld  ', options(true, true, false))).toBe('olleh  \n  dlrow');
  });

  it('keeps emoji and other astral characters intact', () => {
    expect(reverseText('ab😀', options(false, false, false))).toBe('😀ba');
  });

  it('reverses the whole text, line breaks included, in single-line mode', () => {
    expect(reverseText('ab\ncd', options(false, false, false))).toBe('dc\nba');
  });
});
