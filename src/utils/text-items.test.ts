import { describe, expect, it } from 'vitest';
import { containsOnlyDigits, itemCounter, reverseString, unquoteIfQuoted } from './text-items';

describe('text-items', () => {
  it('reverseString keeps astral characters intact', () => {
    expect(reverseString('abc')).toBe('cba');
    expect(reverseString('a😀b')).toBe('b😀a');
    expect(reverseString('')).toBe('');
  });

  it('containsOnlyDigits accepts integers and decimals only', () => {
    expect(containsOnlyDigits(' 12 ')).toBe(true);
    expect(containsOnlyDigits('3.5')).toBe(true);
    expect(containsOnlyDigits('-1')).toBe(false);
    expect(containsOnlyDigits('1e3')).toBe(false);
    expect(containsOnlyDigits('')).toBe(false);
  });

  it('unquoteIfQuoted removes surrounding quotes only', () => {
    expect(unquoteIfQuoted('"a"', '"')).toBe('a');
    expect(unquoteIfQuoted('"a', '"')).toBe('"a');
    expect(unquoteIfQuoted('"', '"')).toBe('"');
    expect(unquoteIfQuoted("'a'", '"')).toBe("'a'");
    expect(unquoteIfQuoted('"a"', '')).toBe('"a"');
  });

  it('itemCounter counts items, optionally ignoring case', () => {
    expect(itemCounter(['a', 'A', 'b', 'a'], false)).toEqual({ a: 2, A: 1, b: 1 });
    expect(itemCounter(['a', 'A', 'b', 'a'], true)).toEqual({ a: 3, b: 1 });
  });

  it('itemCounter shows whitespace items visually', () => {
    expect(itemCounter([' ', '', '\t', ' '], false)).toEqual({ '␣': 2, '␀': 1, '⇥': 1 });
  });
});
