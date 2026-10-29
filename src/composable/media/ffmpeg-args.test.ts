import { describe, expect, it } from 'vitest';
import { atempoChain, toFfmpegSeconds } from './ffmpeg-args';

describe('ffmpeg-args', () => {
  it('atempoChain keeps each factor within 0.5–2', () => {
    expect(atempoChain(1)).toBe('atempo=1');
    expect(atempoChain(1.5)).toBe('atempo=1.5');
    expect(atempoChain(4)).toBe('atempo=2,atempo=2');
    expect(atempoChain(3)).toBe('atempo=2,atempo=1.5');
    expect(atempoChain(0.25)).toBe('atempo=0.5,atempo=0.5');
    expect(atempoChain(0.3)).toBe('atempo=0.5,atempo=0.6');
  });

  it('atempoChain rejects invalid speeds', () => {
    expect(() => atempoChain(0)).toThrow(RangeError);
    expect(() => atempoChain(Number.NaN)).toThrow(RangeError);
  });

  it('toFfmpegSeconds formats with millisecond precision', () => {
    expect(toFfmpegSeconds(62.5)).toBe('62.500');
    expect(toFfmpegSeconds(0)).toBe('0.000');
    expect(() => toFfmpegSeconds(-1)).toThrow(RangeError);
  });
});
