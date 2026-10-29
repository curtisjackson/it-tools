import { describe, expect, it } from 'vitest';
import { audioCodecOf, audioEncodeArgs, containerForCodec } from './audio-formats';

describe('audio-formats', () => {
  it('builds encoder arguments', () => {
    expect(audioEncodeArgs({ format: 'mp3', bitrate: 192, sampleRate: 0, channels: 0 })).toEqual([
      '-vn',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '192k',
    ]);
    expect(audioEncodeArgs({ format: 'flac', bitrate: 192, sampleRate: 48000, channels: 1 })).toEqual([
      '-vn',
      '-c:a',
      'flac',
      '-ar',
      '48000',
      '-ac',
      '1',
    ]);
  });

  it('finds the audio codec and a matching container', () => {
    const banner = '  Stream #0:0: Video: h264\n  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz';
    expect(audioCodecOf(banner)).toBe('aac');
    expect(containerForCodec('aac')).toEqual({ extension: 'm4a', mime: 'audio/mp4' });
    expect(containerForCodec('pcm_mulaw').extension).toBe('mka');
    expect(audioCodecOf('Stream #0:0: Video: h264')).toBeUndefined();
  });
});
