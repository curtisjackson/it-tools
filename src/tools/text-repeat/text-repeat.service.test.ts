// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/repeat/repeatText.service.test.ts
import { describe, expect, it } from 'vitest';
import { repeatText } from './text-repeat.service';

describe('text-repeat', () => {
  it('repeats a letter', () => {
    expect(repeatText('i', 5, '')).toBe('iiiii');
  });

  it('repeats a word', () => {
    expect(repeatText('hello', 3, '')).toBe('hellohellohello');
  });

  it('repeats with a delimiter', () => {
    expect(repeatText('word', 3, ' ')).toBe('word word word');
    expect(repeatText('test', 3, ', ')).toBe('test, test, test');
  });

  it('repeats with an escaped line break', () => {
    expect(repeatText('a', 3, '\\n')).toBe('a\na\na');
  });

  it('returns nothing for zero, negative or invalid counts', () => {
    expect(repeatText('something', 0, '')).toBe('');
    expect(repeatText('something', -2, '')).toBe('');
    expect(repeatText('something', Number.NaN, '')).toBe('');
    expect(repeatText('something', 1.5, '')).toBe('');
  });
});
