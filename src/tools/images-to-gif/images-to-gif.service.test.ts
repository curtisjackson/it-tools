import { describe, expect, it } from 'vitest';
import { buildImagesToGifArgs } from './images-to-gif.service';

const options = { delay: 500, width: 320, height: 240, background: '#ffffff', loop: true };

describe('images-to-gif', () => {
  it('holds each image for the delay and fits it into the size', () => {
    const args = buildImagesToGifArgs(['a.png', 'b.jpg'], 'out.gif', options);
    expect(args.slice(0, 12)).toEqual([
      '-loop',
      '1',
      '-t',
      '0.500',
      '-i',
      'a.png',
      '-loop',
      '1',
      '-t',
      '0.500',
      '-i',
      'b.jpg',
    ]);
    const graph = args[args.indexOf('-filter_complex') + 1];
    expect(graph).toContain(
      '[1:v]scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2:color=0xffffff',
    );
    expect(graph).toContain('[f0][f1]concat=n=2:v=1:a=0,fps=2,split[a][b];[a]palettegen[p];[b][p]paletteuse');
    expect(args.slice(-3)).toEqual(['-loop', '0', 'out.gif']);
  });

  it('validates the input', () => {
    expect(() => buildImagesToGifArgs([], 'out.gif', options)).toThrow();
    expect(() => buildImagesToGifArgs(['a'], 'out.gif', { ...options, delay: 10 })).toThrow(RangeError);
  });
});
