import { describe, expect, it } from 'vitest';
import { buildResizeArgs, buildScaleFilter, resizeSuffix } from './video-resize.service';

const options = { mode: 'preset' as const, height: 480, width: 1280, customHeight: 720 };

describe('video-resize', () => {
  it('scales by height, by width or to an exact size', () => {
    expect(buildScaleFilter(options)).toBe('scale=-2:480');
    expect(buildScaleFilter({ ...options, mode: 'width' })).toBe('scale=1280:-2');
    expect(buildScaleFilter({ ...options, mode: 'custom' })).toBe('scale=1280:720,setsar=1');
  });

  it('names the output after the size', () => {
    expect(resizeSuffix(options)).toBe('_480p');
    expect(resizeSuffix({ ...options, mode: 'width' })).toBe('_1280w');
    expect(resizeSuffix({ ...options, mode: 'custom' })).toBe('_1280x720');
  });

  it('re-encodes to H.264', () => {
    const args = buildResizeArgs('in.mov', 'out.mp4', options);
    expect(args.slice(0, 4)).toEqual(['-i', 'in.mov', '-vf', 'scale=-2:480']);
    expect(args).toContain('libx264');
    expect(args.at(-1)).toBe('out.mp4');
  });
});
