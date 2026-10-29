// EmbedPDF's types bring in @types/emscripten, which then types the ghostscript-wasm-esm modules of
// upstream's PDF tools (pdf-compressor, pdf-concat and the others) as a plain EmscriptenModule. Those
// modules are built with the file system and callMain, which the tools use.
declare global {
  interface EmscriptenModule {
    FS: typeof FS;
    callMain: (args: string[]) => number;
  }
}

export {};
