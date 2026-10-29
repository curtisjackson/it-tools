import { type PngCompressOptions, compressPngPixels } from './png-compressor.service';

export interface PngCompressRequest {
  pixels: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  options: PngCompressOptions;
}

self.addEventListener('message', ({ data }: MessageEvent<PngCompressRequest>) => {
  try {
    const result = compressPngPixels(data.pixels, data.width, data.height, data.options);
    self.postMessage(result, { transfer: [result.data.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});
