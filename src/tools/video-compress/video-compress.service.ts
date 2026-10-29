// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/compress/service.ts, with an "original size" option, the
// height as resolution and an option to drop the audio.
import { h264Args } from '@/composable/media/video-encode';

export interface CompressOptions {
  /** Output height, or 0 to keep the size. */
  height: number;
  /** x264 constant rate factor: 18 is visually lossless, 28+ is small. */
  crf: number;
  removeAudio: boolean;
}

export function buildCompressArgs(
  input: string,
  output: string,
  { height, crf, removeAudio }: CompressOptions,
): string[] {
  return [
    '-i',
    input,
    // Never upscale: min() keeps smaller videos as they are.
    ...(height > 0 ? ['-vf', `scale=-2:'min(${height},ih)'`] : []),
    ...h264Args({ crf, audio: removeAudio ? 'none' : 'aac', audioBitrate: '96k' }),
    output,
  ];
}
