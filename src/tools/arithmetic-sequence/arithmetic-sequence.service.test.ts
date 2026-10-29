// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/number/arithmetic-sequence
import { describe, expect, it } from 'vitest';
import { arithmeticSeriesSum, generateArithmeticSequence } from './arithmetic-sequence.service';

describe('generateArithmeticSequence', () => {
  it('should generate basic arithmetic sequence', () => {
    const result = generateArithmeticSequence(1, 2, 5, ', ');
    expect(result).toBe('1, 3, 5, 7, 9');
  });

  it('should handle negative first term', () => {
    const result = generateArithmeticSequence(-5, 2, 5, ' ');
    expect(result).toBe('-5 -3 -1 1 3');
  });

  it('should handle negative common difference', () => {
    const result = generateArithmeticSequence(10, -2, 5, ',');
    expect(result).toBe('10,8,6,4,2');
  });

  it('should handle decimal numbers', () => {
    const result = generateArithmeticSequence(1.5, 0.5, 4, ' ');
    expect(result).toBe('1.5 2 2.5 3');
  });

  it('should handle single term sequence', () => {
    const result = generateArithmeticSequence(1, 2, 1, ',');
    expect(result).toBe('1');
  });
});

describe('arithmetic sequence with decimals', () => {
  it('does not accumulate floating-point errors', () => {
    expect(generateArithmeticSequence(0, 0.1, 4, ', ')).toBe('0, 0.1, 0.2, 0.3');
  });

  it('sums the series', () => {
    expect(arithmeticSeriesSum(1, 2, 10)).toBe('100');
    expect(arithmeticSeriesSum(0, 0.1, 4)).toBe('0.6');
    expect(arithmeticSeriesSum(5, 1, 0)).toBe('0');
  });

  it('accepts an escaped line break as separator', () => {
    expect(generateArithmeticSequence(1, 1, 3, '\\n')).toBe('1\n2\n3');
  });
});
