import { describe, expect, it } from 'vitest';
import { buildCompressArgs } from './video-compress.service';

describe('video-compress', () => {
  it('scales down without upscaling and sets the quality', () => {
    const args = buildCompressArgs('in.mp4', 'out.mp4', { height: 720, crf: 28, removeAudio: false });
    expect(args.slice(0, 4)).toEqual(['-i', 'in.mp4', '-vf', "scale=-2:'min(720,ih)'"]);
    expect(args).toEqual(expect.arrayContaining(['-crf', '28', '-c:a', 'aac']));
  });

  it('keeps the size and can drop the audio', () => {
    const args = buildCompressArgs('in.mp4', 'out.mp4', { height: 0, crf: 23, removeAudio: true });
    expect(args).not.toContain('-vf');
    expect(args).toContain('-an');
  });
});
