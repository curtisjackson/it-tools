import { describe, expect, it } from 'vitest';
import { buildSpeedArgs } from './video-speed.service';

describe('video-speed', () => {
  it('speeds up video and audio together', () => {
    expect(buildSpeedArgs('in.mp4', 'out.mp4', { speed: 2, removeAudio: false }).slice(0, 6)).toEqual([
      '-i',
      'in.mp4',
      '-vf',
      'setpts=0.5*PTS',
      '-af',
      'atempo=2',
    ]);
  });

  it('slows down beyond the atempo range by chaining', () => {
    const args = buildSpeedArgs('in.mp4', 'out.mp4', { speed: 0.25, removeAudio: false });
    expect(args).toEqual(expect.arrayContaining(['setpts=4*PTS', 'atempo=0.5,atempo=0.5']));
  });

  it('can drop the audio, and rejects invalid speeds', () => {
    const args = buildSpeedArgs('in.mp4', 'out.mp4', { speed: 3, removeAudio: true });
    expect(args).not.toContain('-af');
    expect(args).toContain('-an');
    expect(() => buildSpeedArgs('a', 'b', { speed: 0, removeAudio: false })).toThrow(RangeError);
  });
});
