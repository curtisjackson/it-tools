// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/resize/service.ts. Presets are heights (480p means 480
// pixels high), and the output keeps even dimensions for H.264.
import { h264Args } from '@/composable/media/video-encode';

export type ResizeMode = 'preset' | 'width' | 'custom';

export interface ResizeOptions {
  mode: ResizeMode;
  /** Height for the `preset` mode. */
  height: number;
  /** Width for the `width` and `custom` modes. */
  width: number;
  /** Height for the `custom` mode. */
  customHeight: number;
}

export const resizePresets = [2160, 1440, 1080, 720, 480, 360, 240];

export function buildScaleFilter({ mode, height, width, customHeight }: ResizeOptions): string {
  if (mode === 'preset') {
    return `scale=-2:${height}`;
  }
  if (mode === 'width') {
    return `scale=${width}:-2`;
  }
  return `scale=${width}:${customHeight},setsar=1`;
}

/** `_480p`, `_1280w` or `_1280x720`, for the output file name. */
export function resizeSuffix({ mode, height, width, customHeight }: ResizeOptions): string {
  return mode === 'preset' ? `_${height}p` : mode === 'width' ? `_${width}w` : `_${width}x${customHeight}`;
}

export function buildResizeArgs(input: string, output: string, options: ResizeOptions): string[] {
  return ['-i', input, '-vf', buildScaleFilter(options), ...h264Args(), output];
}
