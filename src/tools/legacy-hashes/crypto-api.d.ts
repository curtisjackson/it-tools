// The hashers of crypto-api 0.8.5 (vendored in src/libs), which have no type declarations.
declare module '@/libs/crypto-api/hasher/*.mjs' {
  export default class Hasher {
    constructor(options?: Record<string, number>);
    /** Takes a binary string: one character per byte. */
    update(message: string): void;
    /** Returns a binary string. */
    finalize(): string;
  }
}
