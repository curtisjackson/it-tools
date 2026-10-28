// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/trim/service.ts, plus a frame-accurate re-encoding mode.
import { toFfmpegSeconds } from '@/composable/media/ffmpeg-args';

export type TrimMode = 'fast' | 'precise';

export interface TrimOptions {
  input: string;
  output: string;
  start: number;
  end: number;
  mode: TrimMode;
}

/**
 * `fast` copies the streams, so the cut snaps to the keyframe before `start`; `precise` re-encodes to H.264/AAC and cuts
 * on the exact frame. Seeking before `-i` keeps both fast on long files.
 */
export function buildTrimArgs({ input, output, start, end, mode }: TrimOptions): string[] {
  if (end <= start) {
    throw new RangeError('The end must be after the start');
  }
  const range = ['-ss', toFfmpegSeconds(start), '-i', input, '-t', toFfmpegSeconds(end - start)];
  if (mode === 'fast') {
    return [...range, '-map', '0', '-c', 'copy', '-avoid_negative_ts', 'make_zero', output];
  }
  return [
    ...range,
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
    output,
  ];
}

/** `fast` keeps the container of the input; `precise` always produces MP4. */
export function getTrimOutput(fileName: string, mode: TrimMode): { extension: string; fileName: string } {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const inputExtension = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const extension = mode === 'fast' && inputExtension ? inputExtension : 'mp4';
  return { extension, fileName: `${base}_trimmed.${extension}` };
}
