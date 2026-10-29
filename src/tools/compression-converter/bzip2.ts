import type { Bzip2Module } from 'libbzip2-wasm';

// Return codes of libbzip2 (bzlib.h).
const BZIP2_ERRORS: Record<number, string> = {
  [-2]: 'Invalid parameter',
  [-3]: 'Out of memory',
  [-4]: 'Data integrity error',
  [-5]: 'Not bzip2 data',
  [-7]: 'Unexpected end of data',
  [-8]: 'The output buffer is full',
};

// The emscripten module is a thenable that resolves to itself, so a promise must never
// resolve to it directly: that would loop forever. It stays wrapped in an object.
let bzip2Module: Promise<{ api: Bzip2Module }> | undefined;

function loadBzip2(): Promise<{ api: Bzip2Module }> {
  bzip2Module ??= import('libbzip2-wasm').then(
    ({ default: Bzip2 }) => new Promise((resolve) => Bzip2().then((api) => resolve({ api }))),
  );
  return bzip2Module;
}

export async function bzip2Compress(bytes: Uint8Array, blockSize: number, workFactor: number): Promise<Uint8Array> {
  const { compressBZ2 } = (await loadBzip2()).api;
  const { error, output } = compressBZ2(bytes, blockSize, workFactor);
  if (error !== 0) {
    throw new Error(`Bzip2 failed: ${BZIP2_ERRORS[error] ?? `error ${error}`}`);
  }
  return output.slice();
}

// libbzip2-wasm (and so CyberChef) stops after the first stream and cannot output more
// than 10 MB, so decompression uses seek-bzip, which reads all streams and checks the CRCs.
export async function bzip2Decompress(bytes: Uint8Array): Promise<Uint8Array> {
  const { default: Bunzip } = await import('seek-bzip');
  try {
    const output = Bunzip.decode(bytes, undefined, true);
    return new Uint8Array(output.buffer, output.byteOffset, output.length);
  } catch (error) {
    throw new Error(`Bzip2: ${error instanceof Error ? error.message : String(error)}`);
  }
}
