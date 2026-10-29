import { describe, expect, it } from 'vitest';
import { ImageKind, extractedImageName, toRgba } from './pdf-extract-images.service';

describe('pdf-extract-images', () => {
  it('expands RGB to RGBA', () => {
    expect([...toRgba(new Uint8Array([1, 2, 3, 4, 5, 6]), 2, 1, ImageKind.RGB_24BPP)]).toEqual([
      1, 2, 3, 255, 4, 5, 6, 255,
    ]);
  });

  it('expands 1-bit rows padded to bytes', () => {
    // 3×2: row 1 = 101, row 2 = 010
    const rgba = toRgba(new Uint8Array([0b1010_0000, 0b0100_0000]), 3, 2, ImageKind.GRAYSCALE_1BPP);
    expect([...rgba].filter((_, i) => i % 4 === 0)).toEqual([255, 0, 255, 0, 255, 0]);
  });

  it('copies RGBA', () => {
    expect([...toRgba(new Uint8Array([9, 8, 7, 6]), 1, 1, ImageKind.RGBA_32BPP)]).toEqual([9, 8, 7, 6]);
  });

  it('names the images', () => {
    expect(extractedImageName('report.PDF', 2, 3)).toBe('report_page2_image3.png');
  });
});
