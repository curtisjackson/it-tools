import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { samplePdf } from '../_shared/fixtures';
import { rotatePdf } from './pdf-rotate.service';

const sample = samplePdf;
const rotations = async (bytes: Uint8Array) =>
  (await PDFDocument.load(bytes)).getPages().map((page) => page.getRotation().angle);

describe('pdf-rotate', () => {
  it('rotates every page when no range is given', async () => {
    expect(await rotations(await rotatePdf(sample, 90, ''))).toEqual([90, 90]);
  });

  it('rotates the selected pages only', async () => {
    expect(await rotations(await rotatePdf(sample, 180, '2'))).toEqual([0, 180]);
  });

  it('adds to the current rotation', async () => {
    const once = await rotatePdf(sample, 270, '');
    expect(await rotations(await rotatePdf(once, 180, '1'))).toEqual([90, 270]);
  });
});
