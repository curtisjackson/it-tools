// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/converters/video-to-gif/service.ts and types.ts, in one ffmpeg pass
// (split → palettegen → paletteuse) instead of two.
import { toFfmpegSeconds } from '@/composable/media/ffmpeg-args';

export interface VideoToGifOptions {
  start: number;
  end: number;
  /** Output width; the height follows the proportions. 0 keeps the video width. */
  width: number;
  fps: number;
  loop: boolean;
}

/** The palette is computed for the clip itself, which keeps GIF colours close to the video. */
export function buildVideoToGifArgs(
  input: string,
  output: string,
  { start, end, width, fps, loop }: VideoToGifOptions,
): string[] {
  if (end <= start) {
    throw new RangeError('The end must be after the start');
  }
  const scale = width > 0 ? `,scale=${width}:-1:flags=lanczos` : '';
  return [
    '-ss',
    toFfmpegSeconds(start),
    '-t',
    toFfmpegSeconds(end - start),
    '-i',
    input,
    '-filter_complex',
    `[0:v]fps=${fps}${scale},split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5`,
    '-loop',
    loop ? '0' : '-1',
    output,
  ];
}
