import { describe, expect, it } from 'vitest';
import { fileExtension, h264Args, outputFileName } from './video-encode';

describe('video-encode', () => {
  it('builds browser-friendly H.264 arguments', () => {
    expect(h264Args()).toEqual([
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
    ]);
    expect(h264Args({ crf: 30, preset: 'ultrafast', audio: 'none' })).toEqual(
      expect.arrayContaining(['30', 'ultrafast', '-an']),
    );
  });

  it('names outputs', () => {
    expect(outputFileName('holiday.MOV', '_rotated', 'mp4')).toBe('holiday_rotated.mp4');
    expect(outputFileName('clip', '_x', 'gif')).toBe('clip_x.gif');
    expect(fileExtension('a.b.WEBM')).toBe('webm');
    expect(fileExtension('noext', 'mp4')).toBe('mp4');
  });
});
