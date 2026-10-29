// Pixel operations on RGBA arrays (ImageData.data). areColorsSimilar is ported from omni-tools (MIT) v0.7.0:
// src/utils/color.ts.

export type Rgba = [number, number, number, number];

const MAX_DISTANCE = Math.sqrt(255 ** 2 * 4);

/** Distance between two colours, 0 (same) to 1 (opposite), alpha included. */
export function colorDistance(a: Rgba, b: Rgba): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 + (a[3] - b[3]) ** 2) / MAX_DISTANCE;
}

/** omni-tools' similarity test: `similarity` is a percentage of the largest possible distance. */
export function areColorsSimilar(
  a: [number, number, number, number?],
  b: [number, number, number, number?],
  similarity: number,
): boolean {
  return colorDistance([a[0], a[1], a[2], a[3] ?? 255], [b[0], b[1], b[2], b[3] ?? 255]) <= similarity / 100;
}

/** `#rgb`, `#rrggbb` or `#rrggbbaa`. */
export function hexToRgba(hex: string): Rgba {
  let digits = hex.replace(/^#/, '');
  if (digits.length === 3) {
    digits = digits.replace(/./g, (d) => d + d);
  }
  if (!/^([\da-f]{6}|[\da-f]{8})$/i.test(digits)) {
    throw new Error(`Invalid colour "${hex}"`);
  }
  const value = (i: number) => Number.parseInt(digits.slice(i, i + 2), 16);
  return [value(0), value(2), value(4), digits.length === 8 ? value(6) : 255];
}

export function rgbaToHex([r, g, b, a]: Rgba): string {
  return `#${[r, g, b, ...(a === 255 ? [] : [a])].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function pixelAt(data: Uint8ClampedArray, i: number): Rgba {
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

/** Replaces the pixels similar to `from` (within `similarity` %) by `to`; returns the number of pixels changed. */
export function replaceColor(data: Uint8ClampedArray, from: Rgba, to: Rgba, similarity: number): number {
  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (colorDistance(pixelAt(data, i), from) <= similarity / 100) {
      data.set(to, i);
      changed++;
    }
  }
  return changed;
}

/**
 * Makes the pixels similar to `color` transparent. With `softness` (in % of distance beyond `similarity`), pixels a
 * little further away become partly transparent, which avoids hard, jagged edges around anti-aliased shapes.
 * The alpha of `color` is ignored: only the visible colour counts.
 */
export function makeTransparent(data: Uint8ClampedArray, color: Rgba, similarity: number, softness = 0): number {
  const threshold = similarity / 100;
  const soft = softness / 100;
  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const distance = colorDistance([data[i], data[i + 1], data[i + 2], 255], [color[0], color[1], color[2], 255]);
    if (distance <= threshold) {
      data[i + 3] = 0;
      changed++;
    } else if (soft > 0 && distance < threshold + soft) {
      data[i + 3] = Math.round((data[i + 3] * (distance - threshold)) / soft);
      changed++;
    }
  }
  return changed;
}
