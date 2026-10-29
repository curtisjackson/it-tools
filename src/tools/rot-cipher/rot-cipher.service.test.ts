// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/rot13 and src/pages/tools/string/rotate
import { describe, expect, it } from 'vitest';
import { caesarShift, rot13, rotate, rotateString } from './rot-cipher.service';

describe('rot13', () => {
  it('should encode a simple string using ROT13', () => {
    const input = 'hello';
    const result = rot13(input);
    expect(result).toBe('uryyb');
  });

  it('should decode a ROT13 encoded string', () => {
    const input = 'uryyb';
    const result = rot13(input);
    expect(result).toBe('hello');
  });

  it('should handle uppercase letters correctly', () => {
    const input = 'HELLO';
    const result = rot13(input);
    expect(result).toBe('URYYB');
  });

  it('should handle mixed case letters correctly', () => {
    const input = 'HelloWorld';
    const result = rot13(input);
    expect(result).toBe('UryybJbeyq');
  });

  it('should handle non-alphabetic characters correctly', () => {
    const input = 'Hello, World!';
    const result = rot13(input);
    expect(result).toBe('Uryyb, Jbeyq!');
  });

  it('should handle an empty string', () => {
    const input = '';
    const result = rot13(input);
    expect(result).toBe('');
  });

  it('should handle a string with numbers correctly', () => {
    const input = '1234';
    const result = rot13(input);
    expect(result).toBe('1234');
  });

  it('should handle a string with symbols correctly', () => {
    const input = '!@#$%^&*()_+-=';
    const result = rot13(input);
    expect(result).toBe('!@#$%^&*()_+-=');
  });

  it('should handle a string with mixed characters correctly', () => {
    const input = 'Hello, World! 123';
    const result = rot13(input);
    expect(result).toBe('Uryyb, Jbeyq! 123');
  });
});

describe('rotate function', () => {
  it('rotates right correctly', () => {
    expect(rotate('abcdef', 2, true)).toBe('efabcd');
    expect(rotate('abcdef', 1, true)).toBe('fabcde');
    expect(rotate('abcdef', 6, true)).toBe('abcdef'); // full rotation
    expect(rotate('abcdef', 7, true)).toBe('fabcde'); // beyond full rotation
  });

  it('rotates left correctly', () => {
    expect(rotate('abcdef', 2, false)).toBe('cdefab');
    expect(rotate('abcdef', 1, false)).toBe('bcdefa');
    expect(rotate('abcdef', 6, false)).toBe('abcdef'); // full rotation
    expect(rotate('abcdef', 7, false)).toBe('bcdefa'); // beyond full rotation
  });

  it('handles empty string', () => {
    expect(rotate('', 2, true)).toBe('');
    expect(rotate('', 2, false)).toBe('');
  });

  it('handles single character string', () => {
    expect(rotate('a', 2, true)).toBe('a');
    expect(rotate('a', 2, false)).toBe('a');
  });
});

describe('rotateString function', () => {
  it('rotates single-line string right', () => {
    expect(rotateString('abcdef', 2, true, false)).toBe('efabcd');
  });

  it('rotates single-line string left', () => {
    expect(rotateString('abcdef', 2, false, false)).toBe('cdefab');
  });

  it('rotates multi-line string right', () => {
    const input = 'abcdef\nghijkl';
    const expected = 'efabcd\nklghij';
    expect(rotateString(input, 2, true, true)).toBe(expected);
  });

  it('rotates multi-line string left', () => {
    const input = 'abcdef\nghijkl';
    const expected = 'cdefab\nijklgh';
    expect(rotateString(input, 2, false, true)).toBe(expected);
  });

  it('handles empty string in multi-line mode', () => {
    expect(rotateString('', 2, true, true)).toBe('');
  });

  it('handles single character string in multi-line mode', () => {
    expect(rotateString('a', 2, true, true)).toBe('a');
  });

  it('handles single character string in single-line mode', () => {
    expect(rotateString('a', 2, true, false)).toBe('a');
  });

  it('handles string with multiple empty lines', () => {
    const input = 'abcdef\n\nxyz';
    const expected = 'efabcd\n\nyzx';
    expect(rotateString(input, 2, true, true)).toBe(expected);
  });
});

describe('caesarShift', () => {
  it('shifts Latin letters by any step, both ways', () => {
    expect(caesarShift('Hello, World!', 3)).toBe('Khoor, Zruog!');
    expect(caesarShift('Khoor, Zruog!', -3)).toBe('Hello, World!');
    expect(caesarShift('xyz', 29)).toBe('abc');
  });

  it('shifts Russian letters over the 33-letter alphabet, ё included', () => {
    expect(caesarShift('Привет, Ёж!', 1, 'cyrillic')).toBe('Рсйгёу, Жз!');
    expect(caesarShift('я', 1, 'cyrillic')).toBe('а');
    expect(caesarShift('abc где', 1, 'both')).toBe('bcd деё');
    expect(caesarShift('abc где', 1, 'latin')).toBe('bcd где');
  });

  it('keeps astral characters intact when rotating', () => {
    expect(rotate('a😀b', 1, true)).toBe('ba😀');
  });
});
