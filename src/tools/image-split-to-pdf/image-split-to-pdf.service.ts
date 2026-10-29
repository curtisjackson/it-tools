// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/image/generic/split/service.ts. The scale is set by fitting the
// image to the page width or by a resolution in dpi, and partial tiles keep their size instead of being stretched.

export type PageFormat = 'A4' | 'A3' | 'Letter' | 'Legal';
export type SplitScale = { mode: 'fit-width' } | { mode: 'dpi'; dpi: number };

export const PAGE_FORMATS: Record<PageFormat, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  Letter: [612, 792],
  Legal: [612, 1008],
};

export interface Tile {
  /** Source rectangle in image pixels. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Where to draw it on the page, in points (PDF origin at the bottom left). */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Cuts the image into page-sized tiles, row by row, each drawn from the top-left corner of the printable area. */
export function computeTiles(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  scale: SplitScale,
): Tile[] {
  const printableWidth = pageWidth - 2 * margin;
  const printableHeight = pageHeight - 2 * margin;
  if (printableWidth <= 0 || printableHeight <= 0) {
    throw new Error('The margins are larger than the page');
  }
  const pxPerPt = scale.mode === 'fit-width' ? imageWidth / printableWidth : scale.dpi / 72;
  const tileWidth = Math.max(1, Math.floor(printableWidth * pxPerPt));
  const tileHeight = Math.max(1, Math.floor(printableHeight * pxPerPt));
  const tiles: Tile[] = [];
  for (let sy = 0; sy < imageHeight; sy += tileHeight) {
    for (let sx = 0; sx < imageWidth; sx += tileWidth) {
      const sw = Math.min(tileWidth, imageWidth - sx);
      const sh = Math.min(tileHeight, imageHeight - sy);
      const width = sw / pxPerPt;
      const height = sh / pxPerPt;
      tiles.push({ sx, sy, sw, sh, x: margin, y: pageHeight - margin - height, width, height });
    }
  }
  return tiles;
}

export function millimetresToPoints(mm: number): number {
  return (mm * 72) / 25.4;
}
