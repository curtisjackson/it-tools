// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/image/generic/change-opacity/service.ts. The fades really change
// the alpha channel (omni-tools painted a coloured gradient over the image), and the result is always a PNG.
import type { Rgba } from '@/utils/image-pixels';

export type OpacityMode = 'solid' | 'linear' | 'radial';
export type FadeDirection = 'right' | 'left' | 'down' | 'up' | 'edges' | 'center';

export interface OpacityOptions {
  mode: OpacityMode;
  /** 0 (transparent) to 1 (unchanged): the whole image in `solid` mode, the faded end otherwise. */
  opacity: number;
  /** `right` fades towards the right edge, `edges` fades from the centre to the edges, `center` the other way. */
  direction: FadeDirection;
  /** Flatten the result on this colour instead of keeping transparency. */
  background?: Rgba;
}

/** The opacity factor of a pixel, from 1 down to `opacity`. */
export function opacityAt(
  x: number,
  y: number,
  width: number,
  height: number,
  { mode, opacity, direction }: OpacityOptions,
): number {
  if (mode === 'solid') {
    return opacity;
  }
  let t: number;
  if (mode === 'linear') {
    const u = width > 1 ? x / (width - 1) : 0;
    const v = height > 1 ? y / (height - 1) : 0;
    t = { right: u, left: 1 - u, down: v, up: 1 - v, edges: u, center: u }[direction];
  } else {
    const dx = (x - (width - 1) / 2) / (width / 2);
    const dy = (y - (height - 1) / 2) / (height / 2);
    const distance = Math.min(1, Math.hypot(dx, dy));
    t = direction === 'center' ? 1 - distance : distance;
  }
  return 1 - t * (1 - opacity);
}

export function applyOpacity(data: Uint8ClampedArray, width: number, height: number, options: OpacityOptions): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = (data[i + 3] / 255) * opacityAt(x, y, width, height, options);
      if (options.background) {
        const [r, g, b] = options.background;
        data[i] = Math.round(data[i] * alpha + r * (1 - alpha));
        data[i + 1] = Math.round(data[i + 1] * alpha + g * (1 - alpha));
        data[i + 2] = Math.round(data[i + 2] * alpha + b * (1 - alpha));
        data[i + 3] = 255;
      } else {
        data[i + 3] = Math.round(alpha * 255);
      }
    }
  }
}
