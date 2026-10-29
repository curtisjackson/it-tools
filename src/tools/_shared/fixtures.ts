import pdfUrl from './fixtures/sample.pdf?inline';
import pngUrl from './fixtures/sample.png?inline';
import { base64ToBytes } from '@/utils/bytes';

// Fixture bytes for unit tests: `node:fs` is replaced by a browser polyfill in this Vite setup, so the files are
// inlined by Vite as data URLs instead.
const bytesOf = (dataUrl: string) => base64ToBytes(dataUrl.slice(dataUrl.indexOf(',') + 1));

export const samplePdf = bytesOf(pdfUrl);
export const samplePng = bytesOf(pngUrl);
