import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { samplePng } from '../_shared/fixtures';
import { imagesToPdf } from './images-to-pdf.service';

const png = { kind: 'png' as const, bytes: samplePng };
const sizes = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((page) => page.getSize());

describe('images-to-pdf', () => {
  it('makes one page per image', async () => {
    expect(await sizes(await imagesToPdf([png, png], { pageSize: 'a4', orientation: 'portrait', margin: 10 }))).toEqual(
      [
        { width: 595.28, height: 841.89 },
        { width: 595.28, height: 841.89 },
      ],
    );
  });

  it('turns the page for a wide image in auto orientation', async () => {
    expect(await sizes(await imagesToPdf([png], { pageSize: 'letter', orientation: 'auto', margin: 0 }))).toEqual([
      { width: 792, height: 612 },
    ]);
  });

  it('fits the page to the image plus margins', async () => {
    const [size] = await sizes(await imagesToPdf([png], { pageSize: 'fit', orientation: 'auto', margin: 0 }));
    expect(size).toEqual({ width: 64, height: 48 });
  });

  it('needs an image', async () => {
    await expect(imagesToPdf([], { pageSize: 'a4', orientation: 'auto', margin: 0 })).rejects.toThrow();
  });
});
