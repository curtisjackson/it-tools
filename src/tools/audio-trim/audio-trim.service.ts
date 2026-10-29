// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/audio/trim/service.ts
import { toFfmpegSeconds } from '@/composable/media/ffmpeg-args';
import { type AudioEncodeOptions, audioEncodeArgs } from '@/composable/media/audio-formats';

/** `options` undefined copies the audio as is (fast, cut on the nearest packet). */
export function buildAudioTrimArgs(
  input: string,
  output: string,
  start: number,
  end: number,
  options?: AudioEncodeOptions,
): string[] {
  if (end <= start) {
    throw new RangeError('The end must be after the start');
  }
  return [
    '-ss',
    toFfmpegSeconds(start),
    '-t',
    toFfmpegSeconds(end - start),
    '-i',
    input,
    ...(options ? audioEncodeArgs(options) : ['-vn', '-c:a', 'copy']),
    output,
  ];
}
