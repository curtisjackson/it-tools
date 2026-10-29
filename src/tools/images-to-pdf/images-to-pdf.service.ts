// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/pdf/convert-to-pdf/service.ts, rewritten on pdf-lib (instead of
// jspdf, so the PDF tools share one library), with automatic orientation per image.
import { PDFDocument } from 'pdf-lib';

export type PageSize = 'a4' | 'letter' | 'fit';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface PdfImage {
  kind: 'jpg' | 'png';
  bytes: Uint8Array;
}

export interface ImagesToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Margin around the image, in millimetres. */
  margin: number;
}

const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };
const MM = 72 / 25.4;

/** One page per image, the image fitted into the page (never upscaled beyond its pixel size at 72 dpi for `fit`). */
export async function imagesToPdf(
  images: PdfImage[],
  { pageSize, orientation, margin }: ImagesToPdfOptions,
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('Choose at least one image');
  }
  const pdf = await PDFDocument.create();
  const gap = Math.max(0, margin) * MM;
  for (const image of images) {
    const embedded = image.kind === 'jpg' ? await pdf.embedJpg(image.bytes) : await pdf.embedPng(image.bytes);
    const landscapeImage = embedded.width > embedded.height;
    let [width, height] =
      pageSize === 'fit' ? [embedded.width + 2 * gap, embedded.height + 2 * gap] : PAGE_SIZES[pageSize];
    const landscape = orientation === 'landscape' || (orientation === 'auto' && landscapeImage);
    if (pageSize !== 'fit' && landscape !== width > height) {
      [width, height] = [height, width];
    }
    const scale = Math.min((width - 2 * gap) / embedded.width, (height - 2 * gap) / embedded.height);
    const [drawWidth, drawHeight] = [embedded.width * scale, embedded.height * scale];
    pdf.addPage([width, height]).drawImage(embedded, {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }
  return pdf.save();
}
