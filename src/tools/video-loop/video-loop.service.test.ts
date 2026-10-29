import { describe, expect, it } from 'vitest';
import { buildLoopArgs } from './video-loop.service';

describe('video-loop', () => {
  it('repeats the input with stream copy', () => {
    expect(buildLoopArgs('in.mp4', 'out.mp4', 3)).toEqual([
      '-stream_loop',
      '2',
      '-i',
      'in.mp4',
      '-c',
      'copy',
      '-map',
      '0',
      'out.mp4',
    ]);
  });

  it('needs at least two plays', () => {
    expect(() => buildLoopArgs('a', 'b', 1)).toThrow(RangeError);
    expect(() => buildLoopArgs('a', 'b', 2.5)).toThrow(RangeError);
  });
});
