// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/gif/images-to-gif/service.ts. Images of other sizes are
// fitted into the first image's size (the concat demuxer used by omni-tools needs identical sizes), and the palette
// is computed over the whole animation.
import { toFfmpegSeconds } from '@/composable/media/ffmpeg-args';

export interface ImagesToGifOptions {
  /** How long each image is shown, in milliseconds. */
  delay: number;
  width: number;
  height: number;
  background: string;
  loop: boolean;
}

export function buildImagesToGifArgs(
  inputs: string[],
  output: string,
  { delay, width, height, background, loop }: ImagesToGifOptions,
): string[] {
  if (inputs.length === 0) {
    throw new Error('Choose at least one image');
  }
  if (!(delay >= 20)) {
    throw new RangeError('GIF frames last at least 20 ms');
  }
  const seconds = delay / 1000;
  const fps = Number((1 / seconds).toFixed(4));
  const color = background.replace('#', '0x');
  const frames = inputs.map(
    (_, i) =>
      `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${color},setsar=1,format=rgb24[f${i}]`,
  );
  const concat = `${inputs.map((_, i) => `[f${i}]`).join('')}concat=n=${inputs.length}:v=1:a=0,fps=${fps},split[a][b];[a]palettegen[p];[b][p]paletteuse`;
  return [
    ...inputs.flatMap((input) => ['-loop', '1', '-t', toFfmpegSeconds(seconds), '-i', input]),
    '-filter_complex',
    [...frames, concat].join(';'),
    '-loop',
    loop ? '0' : '-1',
    output,
  ];
}
