// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/truncate and src/pages/tools/string/extract-substring
import { describe, expect, it } from 'vitest';
import { extractSubstring, initialValues, truncateText } from './text-truncate.service';

describe('repeatText function (normal mode)', () => {
  const text =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  it('should truncate the text correctly on the right side', () => {
    const maxLength = '30';
    const result = truncateText({ ...initialValues, maxLength }, text);
    expect(result).toBe('Lorem ipsum dolor sit amet, co');
  });

  it('should truncate the text correctly on the left side', () => {
    const maxLength = '30';
    const truncationSide = 'left';
    const result = truncateText({ ...initialValues, maxLength, truncationSide }, text);
    expect(result).toBe('labore et dolore magna aliqua.');
  });

  it('should return empty text when truncating from the left to zero characters', () => {
    const result = truncateText({ ...initialValues, maxLength: '0', truncationSide: 'left' }, text);
    expect(result).toBe('');
  });

  it('should truncate the text and add the indicator correctly on the right side', () => {
    const maxLength = '24';
    const addIndicator = true;
    const indicator = '...';
    const result = truncateText({ ...initialValues, maxLength, addIndicator, indicator }, text);
    expect(result).toBe('Lorem ipsum dolor sit...');
  });

  it('should truncate the text and add the indicator correctly on the left side', () => {
    const maxLength = '23';
    const truncationSide = 'left';
    const addIndicator = true;
    const indicator = '...';
    const result = truncateText({ ...initialValues, maxLength, truncationSide, addIndicator, indicator }, text);
    expect(result).toBe('...dolore magna aliqua.');
  });

  it('should throw an error if maxLength is less than zero', () => {
    const maxLength = '-1';
    expect(() => truncateText({ ...initialValues, maxLength }, text)).toThrowError('Length value cannot be negative');
  });

  it('should throw an error if the indicator length is greater than the truncate length', () => {
    const maxLength = '10';
    const addIndicator = true;
    const indicator = '.'.repeat(11);
    expect(() => truncateText({ ...initialValues, maxLength, addIndicator, indicator }, text)).toThrowError(
      'Indicator length is greater than truncation length',
    );
  });
});

describe('repeatText function (line by line mode)', () => {
  const text = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
  const maxLength = '45';

  it('should truncate the multi-line text correctly on the right side', () => {
    const lineByLine = true;
    const result = truncateText({ ...initialValues, maxLength, lineByLine }, text);
    expect(result).toBe(`
Lorem ipsum dolor sit amet, consectetur adipi
Ut enim ad minim veniam, quis nostrud exercit
Duis aute irure dolor in reprehenderit in vol`);
  });

  it('should truncate the multi-line text correctly on the left side', () => {
    const truncationSide = 'left';
    const lineByLine = true;
    const result = truncateText({ ...initialValues, maxLength, truncationSide, lineByLine }, text);
    expect(result).toBe(`
 incididunt ut labore et dolore magna aliqua.
oris nisi ut aliquip ex ea commodo consequat.
 esse cillum dolore eu fugiat nulla pariatur.`);
  });

  it('should truncate the multi-line and add the indicator text correctly on the right side', () => {
    const lineByLine = true;
    const addIndicator = true;
    const indicator = '...';
    const result = truncateText({ ...initialValues, maxLength, lineByLine, addIndicator, indicator }, text);
    expect(result).toBe(`
Lorem ipsum dolor sit amet, consectetur ad...
Ut enim ad minim veniam, quis nostrud exer...
Duis aute irure dolor in reprehenderit in ...`);
  });

  it('should truncate the multi-line and add the indicator text correctly on the left side', () => {
    const lineByLine = true;
    const truncationSide = 'left';
    const addIndicator = true;
    const indicator = '...';
    const result = truncateText(
      {
        ...initialValues,
        maxLength,
        truncationSide,
        lineByLine,
        addIndicator,
        indicator,
      },
      text,
    );
    expect(result).toBe(`
...cididunt ut labore et dolore magna aliqua.
...s nisi ut aliquip ex ea commodo consequat.
...se cillum dolore eu fugiat nulla pariatur.`);
  });
});

describe('extractSubstring', () => {
  it('should extract a substring from single-line input', () => {
    const input = 'hello world';
    const result = extractSubstring(input, 1, 4, false, false);
    expect(result).toBe('hell');
  });

  it('should extract and reverse a substring from single-line input', () => {
    const input = 'hello world';
    const result = extractSubstring(input, 1, 5, false, true);
    expect(result).toBe('olleh');
  });

  it('should extract substrings from multi-line input', () => {
    const input = 'hello\nworld';
    const result = extractSubstring(input, 1, 5, true, false);
    expect(result).toBe('hello\nworld');
  });

  it('should extract and reverse substrings from multi-line input', () => {
    const input = 'hello\nworld';
    const result = extractSubstring(input, 1, 4, true, true);
    expect(result).toBe('lleh\nlrow');
  });

  it('should handle empty input', () => {
    const input = '';
    const result = extractSubstring(input, 1, 5, false, false);
    expect(result).toBe('');
  });

  it('should handle start and length out of bounds', () => {
    const input = 'hello';
    const result = extractSubstring(input, 10, 5, false, false);
    expect(result).toBe('');
  });

  it('should handle negative start and length', () => {
    expect(() => extractSubstring('hello', -1, 5, false, false)).toThrow('Start index must be greater than zero.');
    expect(() => extractSubstring('hello', 1, -5, false, false)).toThrow(
      'Length value must be greater than or equal to zero.',
    );
  });

  it('should handle zero length', () => {
    const input = 'hello';
    const result = extractSubstring(input, 1, 0, false, false);
    expect(result).toBe('');
  });

  it('should work', () => {
    const input = 'je me nomme king\n22 est mon chiffre';
    const result = extractSubstring(input, 12, 7, true, false);
    expect(result).toBe(' king\nchiffre');
  });
});

describe('truncateText with Cyrillic', () => {
  it('truncates with an indicator', () => {
    expect(truncateText({ ...initialValues, maxLength: '7', addIndicator: true, indicator: '…' }, 'Привет, мир')).toBe(
      'Привет…',
    );
  });
});
