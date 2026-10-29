import { describe, expect, it } from 'vitest';
import { buildAudioSpeedArgs } from './audio-speed.service';

describe('audio-speed', () => {
  it('chains atempo and encodes', () => {
    expect(
      buildAudioSpeedArgs('in.mp3', 'out.mp3', 3, { format: 'mp3', bitrate: 128, sampleRate: 0, channels: 0 }),
    ).toEqual(['-i', 'in.mp3', '-af', 'atempo=2,atempo=1.5', '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', 'out.mp3']);
    expect(() =>
      buildAudioSpeedArgs('a', 'b', 0, { format: 'mp3', bitrate: 128, sampleRate: 0, channels: 0 }),
    ).toThrow();
  });
});
