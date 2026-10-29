import { describe, expect, it } from 'vitest';
import { buildAudioTrimArgs } from './audio-trim.service';

describe('audio-trim', () => {
  it('cuts with stream copy', () => {
    expect(buildAudioTrimArgs('in.mp3', 'out.mp3', 1, 2.5)).toEqual([
      '-ss',
      '1.000',
      '-t',
      '1.500',
      '-i',
      'in.mp3',
      '-vn',
      '-c:a',
      'copy',
      'out.mp3',
    ]);
  });

  it('or re-encodes, and rejects an empty range', () => {
    expect(
      buildAudioTrimArgs('in.mp3', 'out.wav', 0, 1, { format: 'wav', bitrate: 192, sampleRate: 0, channels: 0 }),
    ).toContain('pcm_s16le');
    expect(() => buildAudioTrimArgs('a', 'b', 2, 1)).toThrow(RangeError);
  });
});
