// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/pdf/pdf-to-png/service.ts, plus resolution, JPEG and a page range.

export type PageImageFormat = 'png' | 'jpeg';

/** pdf.js renders at 72 dpi for scale 1. */
export function dpiToScale(dpi: number): number {
  return dpi / 72;
}

export function pageImageName(pdfName: string, page: number, pageCount: number, format: PageImageFormat): string {
  const number = String(page).padStart(String(pageCount).length, '0');
  return `${pdfName.replace(/\.pdf$/i, '')}_page${number}.${format === 'jpeg' ? 'jpg' : 'png'}`;
}
