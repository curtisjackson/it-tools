import { describe, expect, it } from 'vitest';
import { dpiToScale, pageImageName } from './pdf-to-images.service';

describe('pdf-to-images', () => {
  it('converts dpi to a pdf.js scale', () => {
    expect(dpiToScale(72)).toBe(1);
    expect(dpiToScale(144)).toBe(2);
  });

  it('names pages so that they sort', () => {
    expect(pageImageName('doc.pdf', 3, 12, 'png')).toBe('doc_page03.png');
    expect(pageImageName('doc.pdf', 3, 5, 'jpeg')).toBe('doc_page3.jpg');
  });
});
