import { describe, expect, it } from 'vitest';
import { buildTrimArgs, getTrimOutput } from './video-trim.service';

describe('video-trim', () => {
  describe('buildTrimArgs', () => {
    it('copies the streams in fast mode', () => {
      expect(buildTrimArgs({ input: 'in.mp4', output: 'out.mp4', start: 1.5, end: 4, mode: 'fast' })).toEqual([
        '-ss',
        '1.500',
        '-i',
        'in.mp4',
        '-t',
        '2.500',
        '-map',
        '0',
        '-c',
        'copy',
        '-avoid_negative_ts',
        'make_zero',
        'out.mp4',
      ]);
    });

    it('re-encodes to H.264 and AAC in precise mode', () => {
      const args = buildTrimArgs({ input: 'in.webm', output: 'out.mp4', start: 0, end: 10, mode: 'precise' });

      expect(args.slice(0, 6)).toEqual(['-ss', '0.000', '-i', 'in.webm', '-t', '10.000']);
      expect(args).toEqual(expect.arrayContaining(['-c:v', 'libx264', '-c:a', 'aac']));
      expect(args.at(-1)).toBe('out.mp4');
    });

    it('rejects an empty range', () => {
      expect(() => buildTrimArgs({ input: 'a', output: 'b', start: 3, end: 3, mode: 'fast' })).toThrow(RangeError);
    });
  });

  describe('getTrimOutput', () => {
    it('keeps the input container in fast mode', () => {
      expect(getTrimOutput('holiday.MKV', 'fast')).toEqual({ extension: 'mkv', fileName: 'holiday_trimmed.mkv' });
    });

    it('produces MP4 in precise mode or without an extension', () => {
      expect(getTrimOutput('holiday.webm', 'precise')).toEqual({ extension: 'mp4', fileName: 'holiday_trimmed.mp4' });
      expect(getTrimOutput('clip', 'fast')).toEqual({ extension: 'mp4', fileName: 'clip_trimmed.mp4' });
    });
  });
});
