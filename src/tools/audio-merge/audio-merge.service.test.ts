import { describe, expect, it } from 'vitest';
import { buildAudioMergeArgs } from './audio-merge.service';

const mp3 = { format: 'mp3' as const, bitrate: 192, sampleRate: 0, channels: 0 };

describe('audio-merge', () => {
  it('normalises and concatenates the inputs', () => {
    const args = buildAudioMergeArgs(['a.mp3', 'b.wav'], 'out.mp3', mp3);
    expect(args.slice(0, 4)).toEqual(['-i', 'a.mp3', '-i', 'b.wav']);
    expect(args[args.indexOf('-filter_complex') + 1]).toBe(
      '[0:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a0];[1:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a1];[a0][a1]concat=n=2:v=0:a=1[a]',
    );
    expect(args).toEqual(expect.arrayContaining(['-map', '[a]', 'libmp3lame']));
  });

  it('needs two files', () => {
    expect(() => buildAudioMergeArgs(['a.mp3'], 'out.mp3', mp3)).toThrow();
  });
});
