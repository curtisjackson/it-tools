// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/palindrome and src/pages/tools/string/create-palindrome
import { describe, expect, it, test } from 'vitest';
import {
  createPalindrome,
  createPalindromeList,
  isPalindrome,
  palindromeList,
  palindromeReport,
} from './palindrome.service';

describe('palindromeList', () => {
  test('should return true for single character words', () => {
    const input = 'a|b|c';
    const separator = '|';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('true|true|true');
  });

  test('should return false for non-palindromes', () => {
    const input = 'hello|world';
    const separator = '|';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('false|false');
  });

  test('should split using regex', () => {
    const input = 'racecar,abba,hello';
    const separator = ',';
    const result = palindromeList('regex', input, separator);
    // Unlike omni-tools, regex results go one per line.
    expect(result).toBe('true\ntrue\nfalse');
  });

  test('should return empty string for empty input', () => {
    const input = '';
    const separator = '|';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('');
  });

  test('should split using custom separator', () => {
    const input = 'racecar;abba;hello';
    const separator = ';';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('true;true;false');
  });

  test('should handle leading and trailing spaces', () => {
    const input = ' racecar | abba | hello ';
    const separator = '|';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('true|true|false');
  });

  test('should handle multilines checking with trimming', () => {
    const input = ' racecar  \n    abba \n  hello ';
    const separator = '\n';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('true\ntrue\nfalse');
  });

  test('should handle empty strings in input', () => {
    const input = 'racecar||hello';
    const separator = '|';
    const result = palindromeList('symbol', input, separator);
    expect(result).toBe('true|true|false');
  });
});

describe('createPalindrome', () => {
  test('should create palindrome by reversing the entire string', () => {
    const input = 'hello';
    const result = createPalindrome(input, true);
    expect(result).toBe('helloolleh');
  });

  test('should create palindrome by reversing the string excluding the last character', () => {
    const input = 'hello';
    const result = createPalindrome(input, false);
    expect(result).toBe('hellolleh');
  });

  test('should return an empty string if input is empty', () => {
    const input = '';
    const result = createPalindrome(input, true);
    expect(result).toBe('');
  });
});

describe('createPalindromeList', () => {
  test('should create palindrome for single-line input', () => {
    const input = 'hello';
    const result = createPalindromeList(input, true, false);
    expect(result).toBe('helloolleh');
  });

  test('should create palindrome for single-line input considering trailing spaces', () => {
    const input = 'hello ';
    const result = createPalindromeList(input, true, false);
    expect(result).toBe('hello  olleh');
  });

  test('should create palindrome for single-line input ignoring trailing spaces if lastChar is set to false', () => {
    const input = 'hello ';
    const result = createPalindromeList(input, true, false);
    expect(result).toBe('hello  olleh');
  });

  test('should create palindrome for multi-line input', () => {
    const input = 'hello\nworld';
    const result = createPalindromeList(input, true, true);
    expect(result).toBe('helloolleh\nworlddlrow');
  });

  test('should create palindrome for no multi-line input', () => {
    const input = 'hello\nworld\n';
    const result = createPalindromeList(input, true, false);
    expect(result).toBe('hello\nworld\n\ndlrow\nolleh');
  });

  test('should handle multi-line input with lastChar set to false', () => {
    const input = 'hello\nworld';
    const result = createPalindromeList(input, false, true);
    expect(result).toBe('hellolleh\nworldlrow');
  });

  test('should return an empty string if input is empty', () => {
    const input = '';
    const result = createPalindromeList(input, true, false);
    expect(result).toBe('');
  });
});

describe('isPalindrome', () => {
  it('ignores case, spaces and punctuation in letters-only mode', () => {
    expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(false);
    expect(isPalindrome('A man, a plan, a canal: Panama', true)).toBe(true);
    expect(isPalindrome('А роза упала на лапу Азора', true)).toBe(true);
  });

  it('compares by code point', () => {
    expect(isPalindrome('😀a😀')).toBe(true);
    expect(createPalindrome('a😀', false)).toBe('a😀a');
  });
});

describe('palindromeList with a typed escape sequence', () => {
  it('splits and joins on a real line break', () => {
    expect(palindromeList('symbol', 'level\nhello', '\\n')).toBe('true\nfalse');
  });
});

describe('palindromeReport', () => {
  it('marks each item', () => {
    expect(palindromeReport('symbol', ' level , hello', ',')).toBe('✅ level\n❌ hello');
    expect(palindromeReport('regex', 'Abba  kayak', '\\s+', true)).toBe('✅ Abba\n✅ kayak');
    expect(palindromeReport('symbol', '', ',')).toBe('');
  });
});
