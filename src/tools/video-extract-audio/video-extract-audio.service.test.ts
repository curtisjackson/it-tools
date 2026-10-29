import { describe, expect, it } from 'vitest';
import { buildExtractAudioArgs } from './video-extract-audio.service';

describe('video-extract-audio', () => {
  it('copies the first audio stream', () => {
    expect(buildExtractAudioArgs('in.mp4', 'out.m4a')).toEqual([
      '-i',
      'in.mp4',
      '-map',
      '0:a:0',
      '-vn',
      '-c:a',
      'copy',
      'out.m4a',
    ]);
  });

  it('or re-encodes it', () => {
    expect(
      buildExtractAudioArgs('in.mp4', 'out.mp3', { format: 'mp3', bitrate: 192, sampleRate: 0, channels: 0 }),
    ).toEqual(['-i', 'in.mp4', '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', 'out.mp3']);
  });
});
