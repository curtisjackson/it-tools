export type LzmaMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function compress(data: Uint8Array, mode: LzmaMode): Uint8Array;
export function compress(
  data: Uint8Array,
  mode: LzmaMode,
  onFinish: (result: Uint8Array | null, error?: unknown) => void,
  onProgress?: (percent: number) => void,
): void;

export function decompress(data: Uint8Array): Uint8Array;
export function decompress(
  data: Uint8Array,
  onFinish: (result: Uint8Array | null, error?: unknown) => void,
  onProgress?: (percent: number) => void,
): void;
