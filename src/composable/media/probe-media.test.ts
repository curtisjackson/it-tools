import { describe, expect, it } from 'vitest';
import { parseFfmpegProbe } from './probe-media';

describe('parseFfmpegProbe', () => {
  it('reads the duration and size of a video', () => {
    const logs = [
      "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':",
      '  Duration: 00:01:03.52, start: 0.000000, bitrate: 119 kb/s',
      '  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 320x240 [SAR 1:1 DAR 4:3], 76 kb/s, 25 fps',
      '  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, mono, fltp, 32 kb/s (default)',
    ];

    expect(parseFfmpegProbe(logs)).toEqual({ duration: 63.52, width: 320, height: 240 });
  });

  it('reads the duration of an audio file without a size', () => {
    const logs = ['  Duration: 01:00:03.00, start: 0.025057, bitrate: 32 kb/s', '  Stream #0:0: Audio: mp3, 44100 Hz'];

    expect(parseFfmpegProbe(logs)).toEqual({ duration: 3603, width: 0, height: 0 });
  });

  it('returns zeros when nothing is known', () => {
    expect(parseFfmpegProbe(['  Duration: N/A, bitrate: N/A'])).toEqual({ duration: 0, width: 0, height: 0 });
  });
});
