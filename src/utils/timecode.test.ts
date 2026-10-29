import { describe, expect, it } from 'vitest';
import { formatTimecode, parseTimecode } from './timecode';

describe('timecode', () => {
  it('formatTimecode', () => {
    expect(formatTimecode(0)).toBe('00:00.000');
    expect(formatTimecode(62.5)).toBe('01:02.500');
    expect(formatTimecode(3723.0004)).toBe('1:02:03.000');
    expect(formatTimecode(59.9996)).toBe('01:00.000');
    expect(formatTimecode(-3)).toBe('00:00.000');
  });

  it('parseTimecode', () => {
    expect(parseTimecode('12')).toBe(12);
    expect(parseTimecode('1.5')).toBe(1.5);
    expect(parseTimecode('01:02.500')).toBe(62.5);
    expect(parseTimecode(' 1:02:03,25 ')).toBe(3723.25);
    expect(parseTimecode('90')).toBe(90);
  });

  it('parseTimecode rejects invalid times', () => {
    expect(() => parseTimecode('')).toThrow('Invalid time');
    expect(() => parseTimecode('1:2:3:4')).toThrow('Invalid time');
    expect(() => parseTimecode('1.5:00')).toThrow('only seconds');
    expect(() => parseTimecode('1:75')).toThrow('below 60');
    expect(() => parseTimecode('-1')).toThrow('Invalid time');
  });

  it('round-trips', () => {
    for (const seconds of [0, 0.04, 59.999, 61, 3600, 7322.123]) {
      expect(parseTimecode(formatTimecode(seconds))).toBeCloseTo(seconds, 3);
    }
  });
});
