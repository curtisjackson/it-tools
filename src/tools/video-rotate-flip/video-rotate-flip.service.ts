// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/rotate/service.ts and src/pages/tools/video/flip/service.ts,
// combined into one filter chain.
import { h264Args } from '@/composable/media/video-encode';

export type Rotation = 0 | 90 | 180 | 270;

export interface RotateFlipOptions {
  /** Clockwise. */
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

const rotationFilters: Record<Rotation, string[]> = {
  0: [],
  90: ['transpose=clock'],
  180: ['hflip', 'vflip'],
  270: ['transpose=cclock'],
};

/** The `-vf` chain, or an empty string when nothing changes. */
export function buildRotateFlipFilter({ rotation, flipHorizontal, flipVertical }: RotateFlipOptions): string {
  return [...rotationFilters[rotation], ...(flipHorizontal ? ['hflip'] : []), ...(flipVertical ? ['vflip'] : [])].join(
    ',',
  );
}

export function buildRotateFlipArgs(input: string, output: string, options: RotateFlipOptions): string[] {
  const filter = buildRotateFlipFilter(options);
  if (!filter) {
    throw new Error('Choose a rotation or a flip');
  }
  // The rotation stored in the input metadata is applied first, then cleared from the output.
  return ['-i', input, '-vf', filter, '-metadata:s:v:0', 'rotate=0', ...h264Args(), output];
}
