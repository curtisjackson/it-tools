import * as pdfJS from 'pdfjs-dist';
import pdfJSWorkerURL from 'pdfjs-dist/build/pdf.worker?url';

// pdf.js with its worker shipped with the app, as in the other PDF tools.
pdfJS.GlobalWorkerOptions.workerSrc = pdfJSWorkerURL;

export { pdfJS };

export function loadPdf(bytes: ArrayBuffer | Uint8Array) {
  return pdfJS.getDocument({ data: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes) }).promise;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), type, quality),
  );
}
