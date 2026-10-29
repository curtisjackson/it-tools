// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/pdf/rotate-pdf/service.ts. The rotation is added to the page's
// current one (omni-tools replaced it, which un-rotated pages that were already rotated).
import { PDFDocument, degrees } from 'pdf-lib';
import { parsePageRanges } from '@/utils/page-ranges';

export type RotationAngle = 90 | 180 | 270;

/** Rotates the selected pages (all when `pageRanges` is empty) clockwise by `angle`. */
export async function rotatePdf(
  bytes: ArrayBuffer | Uint8Array,
  angle: RotationAngle,
  pageRanges: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes);
  for (const pageNumber of parsePageRanges(pageRanges, pdf.getPageCount())) {
    const page = pdf.getPage(pageNumber - 1);
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }
  return pdf.save();
}
