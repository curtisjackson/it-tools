import LZString from 'lz-string';
import { lz4Compress, lz4Decompress } from './lz4';
import { type LzmaMode, compress as lzmaCompressRaw, decompress as lzmaDecompressRaw } from '@/libs/lzma/lzma.mjs';

export type ByteAlgorithm = 'lz4' | 'lzma';
export type CompressionAlgorithm = 'lz-string' | ByteAlgorithm;
export const compressionAlgorithms: CompressionAlgorithm[] = ['lz-string', 'lz4', 'lzma'];

export type LzStringFormat = 'default' | 'utf16' | 'base64' | 'uri';
export const lzStringFormats: LzStringFormat[] = ['default', 'utf16', 'base64', 'uri'];

export interface CompressionOptions {
  lzmaLevel: LzmaMode;
}

export const defaultCompressionOptions: CompressionOptions = {
  lzmaLevel: 6,
};

export type ProgressCallback = (fraction: number) => void;

export const compressedExtensions: Record<ByteAlgorithm, string> = {
  lz4: 'lz4',
  lzma: 'lzma',
};

const LZ_STRING_ALPHABETS: Partial<Record<LzStringFormat, RegExp>> = {
  base64: /^[A-Za-z0-9+/]*={0,2}$/,
  uri: /^[A-Za-z0-9+\-$ ]*$/,
};

export function lzStringCompress(text: string, format: LzStringFormat): string {
  switch (format) {
    case 'default':
      return LZString.compress(text);
    case 'utf16':
      return LZString.compressToUTF16(text);
    case 'base64':
      return LZString.compressToBase64(text);
    case 'uri':
      return LZString.compressToEncodedURIComponent(text);
  }
}

export function lzStringDecompress(text: string, format: LzStringFormat): string {
  const input = format === 'base64' || format === 'uri' ? text.trim() : text;
  if (input === '') {
    return '';
  }
  if (LZ_STRING_ALPHABETS[format] && !LZ_STRING_ALPHABETS[format].test(input)) {
    throw new Error('The input has characters that this format does not use');
  }
  let result: string | null;
  switch (format) {
    case 'default':
      result = LZString.decompress(input);
      break;
    case 'utf16':
      result = LZString.decompressFromUTF16(input);
      break;
    case 'base64':
      result = LZString.decompressFromBase64(input);
      break;
    case 'uri':
      result = LZString.decompressFromEncodedURIComponent(input);
      break;
  }
  if (!result) {
    throw new Error('This is not lz-string data in the selected format');
  }
  return result;
}

function lzmaCall(run: (onFinish: (result: Uint8Array | null, error?: unknown) => void) => void) {
  return new Promise<Uint8Array>((resolve, reject) => {
    run((result, error) => {
      if (error || !result) {
        reject(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'LZMA failed'));
      } else {
        resolve(result);
      }
    });
  });
}

// LZMA "alone" header: properties byte, dictionary size and the uncompressed size.
function checkLzmaHeader(bytes: Uint8Array) {
  if (bytes.length < 13 || bytes[0] >= 9 * 5 * 5) {
    throw new Error('This is not LZMA data: the header is missing or invalid');
  }
}

export function lzmaCompress(bytes: Uint8Array, level: LzmaMode, onProgress?: ProgressCallback) {
  return lzmaCall((onFinish) => lzmaCompressRaw(bytes, level, onFinish, onProgress));
}

export function lzmaDecompress(bytes: Uint8Array, onProgress?: ProgressCallback) {
  if (isXz(bytes)) {
    return Promise.reject(new Error('This is an .xz file. Only .lzma files are supported'));
  }
  try {
    checkLzmaHeader(bytes);
  } catch (error) {
    return Promise.reject(error);
  }
  return lzmaCall((onFinish) =>
    lzmaDecompressRaw(bytes, onFinish, (fraction) => fraction >= 0 && onProgress?.(fraction)),
  );
}

function isXz(bytes: Uint8Array) {
  return [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00].every((byte, i) => bytes[i] === byte);
}

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, i) => bytes[i] === byte);
}

// Guesses the algorithm from the first bytes, to hint that another one was meant.
export function detectCompression(bytes: Uint8Array): ByteAlgorithm | 'xz' | 'gzip' | undefined {
  if (startsWith(bytes, [0x04, 0x22, 0x4d, 0x18]) || startsWith(bytes, [0x02, 0x21, 0x4c, 0x18])) {
    return 'lz4';
  }
  if (isXz(bytes)) {
    return 'xz';
  }
  if (startsWith(bytes, [0x1f, 0x8b])) {
    return 'gzip';
  }
  if (bytes.length >= 13 && bytes[0] === 0x5d && bytes[1] === 0 && bytes[2] === 0) {
    return 'lzma';
  }
  return undefined;
}

export async function compressBytes(
  algorithm: ByteAlgorithm,
  bytes: Uint8Array,
  options: CompressionOptions = defaultCompressionOptions,
  onProgress?: ProgressCallback,
): Promise<Uint8Array> {
  switch (algorithm) {
    case 'lz4':
      return lz4Compress(bytes);
    case 'lzma':
      return lzmaCompress(bytes, options.lzmaLevel, onProgress);
  }
}

export async function decompressBytes(
  algorithm: ByteAlgorithm,
  bytes: Uint8Array,
  onProgress?: ProgressCallback,
): Promise<Uint8Array> {
  switch (algorithm) {
    case 'lz4':
      return lz4Decompress(bytes);
    case 'lzma':
      return lzmaDecompress(bytes, onProgress);
  }
}
