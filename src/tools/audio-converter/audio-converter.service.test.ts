import { describe, expect, it } from 'vitest';
import { buildAudioConvertArgs } from './audio-converter.service';

describe('audio-converter', () => {
  it('re-encodes to the chosen format', () => {
    expect(
      buildAudioConvertArgs('in.wav', 'out.opus', { format: 'opus', bitrate: 96, sampleRate: 48000, channels: 2 }),
    ).toEqual(['-i', 'in.wav', '-vn', '-c:a', 'libopus', '-b:a', '96k', '-ar', '48000', '-ac', '2', 'out.opus']);
  });
});
