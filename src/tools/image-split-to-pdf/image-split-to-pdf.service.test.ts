import { describe, expect, it } from 'vitest';
import { computeTiles, millimetresToPoints } from './image-split-to-pdf.service';

describe('image-split-to-pdf', () => {
  it('fits a long image to the page width and slices it by height', () => {
    // 100×300 pt printable, image 1000 px wide: 10 px per pt, so tiles are 1000×3000 px.
    const tiles = computeTiles(1000, 7000, 120, 320, 10, { mode: 'fit-width' });
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 3000, x: 10, y: 10, width: 100, height: 300 });
    // The last tile keeps its size and sticks to the top of the page.
    expect(tiles[2]).toEqual({ sx: 0, sy: 6000, sw: 1000, sh: 1000, x: 10, y: 210, width: 100, height: 100 });
  });

  it('uses a fixed resolution in dpi, in columns and rows', () => {
    const tiles = computeTiles(300, 300, 144, 144, 0, { mode: 'dpi', dpi: 144 });
    expect(tiles.map(({ sx, sy, sw, sh }) => [sx, sy, sw, sh])).toEqual([
      [0, 0, 288, 288],
      [288, 0, 12, 288],
      [0, 288, 288, 12],
      [288, 288, 12, 12],
    ]);
  });

  it('rejects margins larger than the page', () => {
    expect(() => computeTiles(10, 10, 100, 100, 60, { mode: 'fit-width' })).toThrow();
  });

  it('converts millimetres', () => {
    expect(millimetresToPoints(25.4)).toBe(72);
  });
});
