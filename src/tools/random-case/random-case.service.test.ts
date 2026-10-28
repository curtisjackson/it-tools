// Test cases partly ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/randomize-case/randomize-case.service.test.ts
import { describe, expect, it } from 'vitest';
import { alternateCase, randomizeCase } from './random-case.service';

describe('random-case', () => {
  it('keeps the length and only changes the case of letters', () => {
    const input = '123 hello! @world Привет';
    const result = randomizeCase(input);

    expect(result).toHaveLength(input.length);
    expect(result.toLowerCase()).toBe(input.toLowerCase());
  });

  it('uses the random source for each character', () => {
    const values = [0.1, 0.9, 0.1, 0.9];
    let i = 0;
    expect(randomizeCase('abcd', () => values[i++])).toBe('aBcD');
  });

  it('handles an empty string', () => {
    expect(randomizeCase('')).toBe('');
  });

  it('alternates the case of letters, skipping other characters', () => {
    expect(alternateCase('hello world')).toBe('hElLo WoRlD');
    expect(alternateCase('hello world', true)).toBe('HeLlO wOrLd');
    expect(alternateCase('a-b 1c')).toBe('a-B 1c');
  });
});
