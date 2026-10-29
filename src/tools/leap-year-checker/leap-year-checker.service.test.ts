import { describe, expect, it } from 'vitest';
import { checkLeapYears, isLeapYear } from './leap-year-checker.service';

describe('leap-year-checker', () => {
  it('applies the Gregorian rules', () => {
    expect([2024, 2023, 1900, 2000, 2100, 2400, 4].map(isLeapYear)).toEqual([
      true,
      false,
      false,
      true,
      false,
      true,
      true,
    ]);
  });

  it('checks one year per line and flags invalid lines', () => {
    expect(checkLeapYears('2024\n\n 1900 \nabc\n12345')).toEqual([
      { kind: 'year', year: 2024, leap: true },
      { kind: 'year', year: 1900, leap: false },
      { kind: 'invalid', text: 'abc' },
      { kind: 'invalid', text: '12345' },
    ]);
  });

  it('expands ranges in either order', () => {
    expect(checkLeapYears('2023-2025').map((line) => line.kind === 'year' && line.leap)).toEqual([false, true, false]);
    expect(checkLeapYears('2025 – 2023')).toHaveLength(3);
  });

  it('returns nothing for empty input', () => {
    expect(checkLeapYears('')).toEqual([]);
  });
});
