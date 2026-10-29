import { unzlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { type PngCompressOptions, compressPngPixels } from './png-compressor.service';

const WIDTH = 120;
const HEIGHT = 90;
const defaults: PngCompressOptions = { quality: 60, dithering: false, maxOutputSizeInKB: 0 };

/** A noisy gradient: enough distinct colours for a palette to matter. */
function gradient(): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const p = (y * WIDTH + x) * 4;
      pixels[p] = (x * 255) / WIDTH;
      pixels[p + 1] = (y * 255) / HEIGHT;
      pixels[p + 2] = (x * y) % 256;
      pixels[p + 3] = 255;
    }
  }
  return pixels;
}

/** Decodes the indexed, unfiltered, non-interlaced PNGs that the encoder writes. */
function decode(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks: Record<string, Uint8Array> = {};
  for (let offset = 8; offset < png.length; ) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    chunks[type] = png.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
  }
  const header = new DataView(chunks.IHDR.buffer, chunks.IHDR.byteOffset);
  const [width, height, bitDepth] = [header.getUint32(0), header.getUint32(4), chunks.IHDR[8]];
  expect(chunks.IHDR[9]).toBe(3);
  const raw = unzlibSync(chunks.IDAT);
  const rowBytes = Math.ceil((width * bitDepth) / 8);
  const transparency = chunks.tRNS ?? new Uint8Array(0);
  const pixel = (x: number, y: number) => {
    const row = y * (rowBytes + 1);
    expect(raw[row]).toBe(0);
    const bit = x * bitDepth;
    const index = (raw[row + 1 + (bit >> 3)] >> (8 - bitDepth - (bit & 7))) & ((1 << bitDepth) - 1);
    const color = [...chunks.PLTE.subarray(index * 3, index * 3 + 3)];
    return [...color, index < transparency.length ? transparency[index] : 255];
  };
  return { width, height, bitDepth, colors: chunks.PLTE.length / 3, pixel };
}

describe('png-compressor', () => {
  it('keeps the dimensions and makes the file smaller than the raw pixels', () => {
    const pixels = gradient();
    const { data } = compressPngPixels(gradient(), WIDTH, HEIGHT, defaults);
    const image = decode(data);
    expect([image.width, image.height]).toEqual([WIDTH, HEIGHT]);
    expect(data.length).toBeLessThan(pixels.length);
  });

  it('keeps colours close to the original ones', () => {
    const { data } = compressPngPixels(gradient(), WIDTH, HEIGHT, { ...defaults, quality: 100 });
    const image = decode(data);
    const original = gradient();
    let worst = 0;
    for (let y = 0; y < HEIGHT; y += 7) {
      for (let x = 0; x < WIDTH; x += 7) {
        const p = (y * WIDTH + x) * 4;
        const [r, g, b] = image.pixel(x, y);
        worst = Math.max(
          worst,
          Math.abs(r - original[p]),
          Math.abs(g - original[p + 1]),
          Math.abs(b - original[p + 2]),
        );
      }
    }
    expect(worst).toBeLessThan(40);
  });

  it('dithers without changing the dimensions', () => {
    const { data } = compressPngPixels(gradient(), WIDTH, HEIGHT, { ...defaults, dithering: true });
    expect(decode(data).width).toBe(WIDTH);
  });

  it('shrinks the palette until the size budget is met', () => {
    const result = compressPngPixels(gradient(), WIDTH, HEIGHT, { ...defaults, quality: 100, maxOutputSizeInKB: 3 });
    expect(result.targetReached).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(3 * 1024);
    expect(result.colors).toBeLessThan(256);
  });

  it('reports a budget it cannot meet', () => {
    const result = compressPngPixels(gradient(), WIDTH, HEIGHT, { ...defaults, maxOutputSizeInKB: 0.01 });
    expect(result.targetReached).toBe(false);
    expect(result.colors).toBe(2);
  });

  it('keeps transparent pixels transparent', () => {
    const pixels = gradient();
    for (let i = 3; i < pixels.length / 2; i += 4) {
      pixels[i] = 0;
    }
    const image = decode(compressPngPixels(pixels, WIDTH, HEIGHT, defaults).data);
    expect(image.pixel(0, 0)[3]).toBe(0);
    expect(image.pixel(WIDTH - 1, HEIGHT - 1)[3]).toBe(255);
  });

  it('packs small palettes below 8 bits per pixel', () => {
    const result = compressPngPixels(gradient(), WIDTH, HEIGHT, { ...defaults, quality: 1 });
    const image = decode(result.data);
    expect(result.colors).toBeLessThanOrEqual(3);
    expect(image.bitDepth).toBeLessThan(8);
    expect(image.pixel(WIDTH - 1, HEIGHT - 1)).toHaveLength(4);
  });

  it('rejects an empty image', () => {
    expect(() => compressPngPixels(new Uint8ClampedArray(0), 0, 0, defaults)).toThrow();
  });
});
