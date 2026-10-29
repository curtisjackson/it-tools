import { describe, expect, it } from 'vitest';
import { type CompressOptions, compressedFileName, libraryOptions, pickResult } from './image-compressor.service';

const defaults: CompressOptions = { maxSizeMB: 1, quality: 80, maxDimension: 0, format: 'keep', keepExif: true };
const photo = new File([new Uint8Array(100)], 'photo.jpg', { type: 'image/jpeg' });
const drawing = new File([new Uint8Array(100)], 'drawing.png', { type: 'image/png' });

describe('image-compressor', () => {
  describe('libraryOptions', () => {
    it('maps the options of the tool to the options of the library', () => {
      expect(libraryOptions(photo, defaults)).toEqual({
        maxSizeMB: 1,
        maxWidthOrHeight: undefined,
        initialQuality: 0.8,
        fileType: 'image/jpeg',
        preserveExif: true,
      });
    });

    it('treats 0 as no limit and clamps the quality', () => {
      const options = libraryOptions(photo, { ...defaults, maxSizeMB: 0, maxDimension: 1920, quality: 5 });
      expect(options.maxSizeMB).toBe(Number.POSITIVE_INFINITY);
      expect(options.maxWidthOrHeight).toBe(1920);
      expect(options.initialQuality).toBe(0.1);
    });

    it('keeps the EXIF of JPEG output only', () => {
      expect(libraryOptions(drawing, defaults).preserveExif).toBe(false);
      expect(libraryOptions(photo, { ...defaults, format: 'image/webp' })).toMatchObject({
        fileType: 'image/webp',
        preserveExif: false,
      });
      expect(libraryOptions(drawing, { ...defaults, format: 'image/jpeg' }).preserveExif).toBe(true);
      expect(libraryOptions(photo, { ...defaults, keepExif: false }).preserveExif).toBe(false);
    });
  });

  it('changes the extension with the format', () => {
    expect(compressedFileName(photo, defaults)).toBe('photo.jpg');
    expect(compressedFileName(photo, { ...defaults, format: 'image/webp' })).toBe('photo.webp');
    expect(compressedFileName(drawing, { ...defaults, format: 'image/jpeg' })).toBe('drawing.jpg');
  });

  describe('pickResult', () => {
    it('returns the compressed file', () => {
      const result = pickResult(photo, new Blob([new Uint8Array(40)], { type: 'image/jpeg' }), defaults);
      expect(result.name).toBe('photo.jpg');
      expect(result.size).toBe(40);
    });

    it('keeps the original when the compressed file is not smaller', () => {
      expect(pickResult(photo, new Blob([new Uint8Array(120)], { type: 'image/jpeg' }), defaults)).toBe(photo);
    });

    it('returns a larger file when the format or the resolution changes', () => {
      const larger = new Blob([new Uint8Array(120)], { type: 'image/webp' });
      expect(pickResult(photo, larger, { ...defaults, format: 'image/webp' }).name).toBe('photo.webp');
      expect(pickResult(photo, larger, { ...defaults, maxDimension: 100 }).size).toBe(120);
    });
  });
});
