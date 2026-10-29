import { describe, expect, it } from 'vitest';
import { areColorsSimilar, colorDistance, hexToRgba, makeTransparent, replaceColor, rgbaToHex } from './image-pixels';

const pixels = (...colors: number[][]) => new Uint8ClampedArray(colors.flat());

describe('image-pixels', () => {
  it('measures colour distance', () => {
    expect(colorDistance([0, 0, 0, 255], [0, 0, 0, 255])).toBe(0);
    expect(colorDistance([0, 0, 0, 0], [255, 255, 255, 255])).toBe(1);
    expect(areColorsSimilar([250, 250, 250], [255, 255, 255], 2)).toBe(true);
    expect(areColorsSimilar([200, 200, 200], [255, 255, 255], 2)).toBe(false);
  });

  it('parses and formats hex colours', () => {
    expect(hexToRgba('#fff')).toEqual([255, 255, 255, 255]);
    expect(hexToRgba('11223380')).toEqual([17, 34, 51, 128]);
    expect(rgbaToHex([17, 34, 51, 255])).toBe('#112233');
    expect(rgbaToHex([17, 34, 51, 128])).toBe('#11223380');
    expect(() => hexToRgba('#12')).toThrow();
  });

  it('replaces similar colours only', () => {
    const data = pixels([255, 255, 255, 255], [250, 252, 255, 255], [0, 0, 0, 255]);
    expect(replaceColor(data, [255, 255, 255, 255], [255, 0, 0, 255], 5)).toBe(2);
    expect([...data]).toEqual([255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 0, 255]);
  });

  it('makes a colour transparent, with soft edges', () => {
    const data = pixels([255, 255, 255, 255], [127, 127, 127, 255], [0, 0, 0, 255]);
    makeTransparent(data, [255, 255, 255, 255], 10, 60);
    expect(data[3]).toBe(0);
    expect(data[7]).toBeGreaterThan(0);
    expect(data[7]).toBeLessThan(255);
    expect(data[11]).toBe(255);
  });

  it('ignores the alpha of the chosen colour when making it transparent', () => {
    const data = pixels([255, 255, 255, 255]);
    expect(makeTransparent(data, [255, 255, 255, 0], 1)).toBe(1);
  });
});
