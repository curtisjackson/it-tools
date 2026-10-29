import { describe, expect, it } from 'vitest';
import { type AddAudioOptions, buildAddAudioArgs } from './video-add-audio.service';

const base: AddAudioOptions = {
  video: 'v.mp4',
  audio: 'a.mp3',
  output: 'out.mp4',
  mode: 'replace',
  volume: 100,
  originalVolume: 100,
  loop: false,
  offset: 0,
  videoDuration: 12.5,
  videoHasAudio: true,
};
const graphOf = (args: string[]) => args[args.indexOf('-filter_complex') + 1];

describe('video-add-audio', () => {
  it('replaces the audio, padded to the video length', () => {
    const args = buildAddAudioArgs(base);
    expect(args.slice(0, 4)).toEqual(['-i', 'v.mp4', '-i', 'a.mp3']);
    expect(graphOf(args)).toBe('[1:a]volume=1.00,apad[aout]');
    expect(args).toEqual(expect.arrayContaining(['-map', '0:v:0', '-map', '[aout]', '-c:v', 'copy', '-t', '12.500']));
  });

  it('mixes with the original audio without normalising', () => {
    expect(graphOf(buildAddAudioArgs({ ...base, mode: 'mix', volume: 50, originalVolume: 80 }))).toBe(
      '[1:a]volume=0.50,apad[added];[0:a]volume=0.80[original];[original][added]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]',
    );
  });

  it('replaces when mixing into a silent video', () => {
    expect(graphOf(buildAddAudioArgs({ ...base, mode: 'mix', videoHasAudio: false }))).toBe(
      '[1:a]volume=1.00,apad[aout]',
    );
  });

  it('delays and loops the added audio', () => {
    const args = buildAddAudioArgs({ ...base, offset: 2.25, loop: true });
    expect(args.slice(0, 6)).toEqual(['-i', 'v.mp4', '-stream_loop', '-1', '-i', 'a.mp3']);
    expect(graphOf(args)).toBe('[1:a]volume=1.00,adelay=2250:all=1,apad[aout]');
  });

  it('needs the video duration', () => {
    expect(() => buildAddAudioArgs({ ...base, videoDuration: 0 })).toThrow();
  });
});
