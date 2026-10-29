// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/pdf/extract-images-from-pdf/service.ts. The pixel data that
// pdf.js gives is converted to RGBA by its kind (omni-tools copied RGB and 1-bit images as if they were RGBA).

/** pdf.js `ImageKind`: 1 = 1-bit grayscale, 2 = RGB, 3 = RGBA. */
export const ImageKind = { GRAYSCALE_1BPP: 1, RGB_24BPP: 2, RGBA_32BPP: 3 } as const;

export function toRgba(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  kind: number,
): Uint8ClampedArray<ArrayBuffer> {
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === ImageKind.RGBA_32BPP) {
    rgba.set(data.subarray(0, rgba.length));
    return rgba;
  }
  if (kind === ImageKind.RGB_24BPP) {
    for (let src = 0, dst = 0; dst < rgba.length; src += 3, dst += 4) {
      rgba[dst] = data[src];
      rgba[dst + 1] = data[src + 1];
      rgba[dst + 2] = data[src + 2];
      rgba[dst + 3] = 255;
    }
    return rgba;
  }
  // 1 bit per pixel, rows padded to whole bytes, 1 = white.
  const rowBytes = Math.ceil(width / 8);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = data[y * rowBytes + (x >> 3)] & (0x80 >> (x & 7)) ? 255 : 0;
      const dst = (y * width + x) * 4;
      rgba[dst] = value;
      rgba[dst + 1] = value;
      rgba[dst + 2] = value;
      rgba[dst + 3] = 255;
    }
  }
  return rgba;
}

export function extractedImageName(pdfName: string, page: number, index: number): string {
  return `${pdfName.replace(/\.pdf$/i, '')}_page${page}_image${index}.png`;
}
