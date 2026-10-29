declare module 'libbzip2-wasm' {
  export interface Bzip2Result {
    error: number;
    output: Uint8Array;
  }
  export interface Bzip2Module {
    compressBZ2: (input: Uint8Array, blockSize: number, workFactor: number) => Bzip2Result;
    decompressBZ2: (input: Uint8Array, small: number) => Bzip2Result;
  }
  // An emscripten module: `then` hands over the module, which is itself a thenable.
  export default function Bzip2(): { then: (callback: (module: Bzip2Module) => void) => void };
}

declare module 'seek-bzip' {
  const Bunzip: { decode: (input: Uint8Array, output?: number, multistream?: boolean) => Uint8Array };
  export default Bunzip;
}
