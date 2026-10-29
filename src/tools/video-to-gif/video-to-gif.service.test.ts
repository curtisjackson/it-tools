import { describe, expect, it } from 'vitest';
import { buildVideoToGifArgs } from './video-to-gif.service';

describe('video-to-gif', () => {
  it('cuts the range and builds a palette in one pass', () => {
    expect(buildVideoToGifArgs('in.mp4', 'out.gif', { start: 1, end: 3.5, width: 480, fps: 12, loop: true })).toEqual([
      '-ss',
      '1.000',
      '-t',
      '2.500',
      '-i',
      'in.mp4',
      '-filter_complex',
      '[0:v]fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5',
      '-loop',
      '0',
      'out.gif',
    ]);
  });

  it('keeps the width and plays once when asked', () => {
    const args = buildVideoToGifArgs('in.mp4', 'out.gif', { start: 0, end: 1, width: 0, fps: 10, loop: false });
    expect(args[args.indexOf('-filter_complex') + 1]).toMatch(/^\[0:v\]fps=10,split/);
    expect(args.slice(-3, -1)).toEqual(['-loop', '-1']);
  });

  it('rejects an empty range', () => {
    expect(() => buildVideoToGifArgs('a', 'b', { start: 2, end: 2, width: 0, fps: 10, loop: true })).toThrow(
      RangeError,
    );
  });
});
