// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/image/generic/compress/service.ts. The maximum size, resolution and
// output format are options (omni-tools always scaled images down to 1920 px), a result larger than its original is
// replaced by the original, and the library worker is served from the bundle rather than from a CDN.
import type { Options } from 'browser-image-compression';
import { replaceExtension } from '@/utils/file-output';

export type OutputFormat = 'keep' | 'image/jpeg' | 'image/webp' | 'image/png';

export interface CompressOptions {
  /** Target size in megabytes; 0 for no limit. */
  maxSizeMB: number;
  /** Quality from 10 to 100. */
  quality: number;
  /** Longest side in pixels; 0 to keep the resolution. */
  maxDimension: number;
  format: OutputFormat;
  keepExif: boolean;
}

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };

export function libraryOptions(source: File, options: CompressOptions): Options {
  const fileType = options.format === 'keep' ? source.type : options.format;
  return {
    maxSizeMB: options.maxSizeMB > 0 ? options.maxSizeMB : Number.POSITIVE_INFINITY,
    maxWidthOrHeight: options.maxDimension > 0 ? options.maxDimension : undefined,
    initialQuality: Math.min(100, Math.max(10, options.quality)) / 100,
    fileType,
    // The library only keeps the EXIF of JPEG images.
    preserveExif: options.keepExif && fileType === 'image/jpeg',
  };
}

export function compressedFileName(source: File, options: CompressOptions): string {
  return options.format === 'keep' ? source.name : replaceExtension(source.name, extensions[options.format]);
}

/** The compressed file under its output name, or the original when compressing made it larger in the same format. */
export function pickResult(source: File, compressed: Blob, options: CompressOptions): File {
  if (options.format === 'keep' && options.maxDimension === 0 && compressed.size >= source.size) {
    return source;
  }
  return new File([compressed], compressedFileName(source, options), { type: compressed.type || source.type });
}
