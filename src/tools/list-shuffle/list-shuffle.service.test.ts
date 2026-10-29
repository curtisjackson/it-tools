// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/shuffle
import { describe, expect, it } from 'vitest';
import { type SplitOperatorType, shuffleArray, shuffleList } from './list-shuffle.service';

describe('shuffle function', () => {
  it('should be a 4 length list if no length value defined', () => {
    const input: string = 'apple, pineaple, lemon, orange';
    const splitOperatorType: SplitOperatorType = 'symbol';
    const splitSeparator = ', ';
    const joinSeparator = ' ';

    const result = shuffleList(splitOperatorType, input, splitSeparator, joinSeparator);
    expect(result.split(joinSeparator).length).toBe(4);
  });

  it('should be a 2 length list if length value is set to 2', () => {
    const input: string = 'apple, pineaple, lemon, orange';
    const splitOperatorType: SplitOperatorType = 'symbol';
    const splitSeparator = ', ';
    const joinSeparator = ' ';
    const length = 2;

    const result = shuffleList(splitOperatorType, input, splitSeparator, joinSeparator, length);
    expect(result.split(joinSeparator).length).toBe(2);
  });

  it('should be a 4 length list if length value is set to 99', () => {
    const input: string = 'apple, pineaple, lemon, orange';
    const splitOperatorType: SplitOperatorType = 'symbol';
    const splitSeparator = ', ';
    const joinSeparator = ' ';
    const length = 99;

    const result = shuffleList(splitOperatorType, input, splitSeparator, joinSeparator, length);
    expect(result.split(joinSeparator).length).toBe(4);
  });

  it('should include a random element if length value is undefined', () => {
    const input: string = 'apple, pineaple, lemon, orange';
    const splitOperatorType: SplitOperatorType = 'symbol';
    const splitSeparator = ', ';
    const joinSeparator = ' ';

    const result = shuffleList(
      splitOperatorType,
      input,
      splitSeparator,
      joinSeparator,
      // omni-tools passes an undeclared `length` here (window.length in a browser): the intent is no length.
      undefined,
    );
    expect(result.split(joinSeparator)).toContain('apple');
  });

  it('should return empty string if input is empty', () => {
    const input: string = '';
    const splitOperatorType: SplitOperatorType = 'symbol';
    const splitSeparator = ', ';
    const joinSeparator = ' ';

    const result = shuffleList(
      splitOperatorType,
      input,
      splitSeparator,
      joinSeparator,
      // omni-tools passes an undeclared `length` here (window.length in a browser): the intent is no length.
      undefined,
    );
    expect(result).toBe('');
  });
});

describe('shuffleArray', () => {
  it('is a Fisher–Yates shuffle driven by the random source', () => {
    expect(shuffleArray(['a', 'b', 'c'], () => 0)).toEqual(['b', 'c', 'a']);
    expect(shuffleArray(['a', 'b', 'c'], () => 0.99)).toEqual(['a', 'b', 'c']);
  });

  it('does not modify its input', () => {
    const input = ['a', 'b', 'c'];
    shuffleArray(input);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
