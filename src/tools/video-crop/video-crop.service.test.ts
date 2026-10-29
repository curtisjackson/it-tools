import { describe, expect, it } from 'vitest';
import { buildCropArgs, normalizeCropArea } from './video-crop.service';

describe('video-crop', () => {
  it('rounds the area to even values', () => {
    expect(normalizeCropArea({ x: 11, y: 7.6, width: 101, height: 55 }, 320, 240)).toEqual({
      x: 10,
      y: 6,
      width: 100,
      height: 54,
    });
  });

  it('keeps the area inside the frame', () => {
    expect(normalizeCropArea({ x: -5, y: 300, width: 1000, height: 50 }, 320, 240)).toEqual({
      x: 0,
      y: 238,
      width: 320,
      height: 2,
    });
  });

  it('builds the crop filter', () => {
    expect(buildCropArgs('in.mp4', 'out.mp4', { x: 10, y: 20, width: 100, height: 50 }).slice(0, 4)).toEqual([
      '-i',
      'in.mp4',
      '-vf',
      'crop=100:50:10:20',
    ]);
    expect(() => buildCropArgs('a', 'b', { x: 0, y: 0, width: 0, height: 10 })).toThrow();
  });
});
