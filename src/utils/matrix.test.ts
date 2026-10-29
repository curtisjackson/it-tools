import { describe, expect, it } from 'vitest';
import { normalizeAndFill, transpose } from './matrix';

describe('matrix', () => {
  it('transposes a rectangular matrix', () => {
    expect(
      transpose([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    ).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  it('transposes a ragged matrix using the longest row', () => {
    expect(transpose([['a'], ['b', 'c']])).toEqual([
      ['a', 'b'],
      [undefined, 'c'],
    ]);
  });

  it('transposes an empty matrix', () => {
    expect(transpose([])).toEqual([]);
  });

  it('fills rows up to the longest row', () => {
    expect(normalizeAndFill([['a'], ['b', 'c', 'd']], '')).toEqual([
      ['a', '', ''],
      ['b', 'c', 'd'],
    ]);
  });

  it('fills rows up to a desired length without truncating longer rows', () => {
    expect(normalizeAndFill([['a'], ['b', 'c', 'd']], '-', 2)).toEqual([
      ['a', '-'],
      ['b', 'c', 'd'],
    ]);
  });
});
