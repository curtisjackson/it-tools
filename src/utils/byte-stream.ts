// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/lib/Stream.mjs (Crown Copyright 2018).
// Only the byte-level reads used by the ported parsers are kept (bit reads and continueUntil are left out), and reads
// past the end throw instead of silently returning garbage.

/** A cursor over a byte array, for parsing binary protocols. */
export class ByteStream {
  readonly bytes: Uint8Array;
  position: number;

  constructor(bytes: Uint8Array, position = 0) {
    this.bytes = bytes;
    this.position = position;
  }

  get length(): number {
    return this.bytes.length;
  }

  clone(): ByteStream {
    return new ByteStream(this.bytes, this.position);
  }

  hasMore(): boolean {
    return this.position < this.length;
  }

  /** Reads `numBytes` bytes, or all the remaining bytes when omitted. */
  getBytes(numBytes?: number): Uint8Array {
    const end = numBytes === undefined ? this.length : this.position + numBytes;
    this.assertReadable(end);
    const bytes = this.bytes.slice(this.position, end);
    this.position = end;
    return bytes;
  }

  /** Reads an unsigned integer of up to 6 bytes. */
  readInt(numBytes: number, endianness: 'be' | 'le' = 'be'): number {
    if (numBytes > 6) {
      throw new RangeError('Cannot read more than 6 bytes as a number');
    }
    const end = this.position + numBytes;
    this.assertReadable(end);
    let value = 0;
    for (let i = 0; i < numBytes; i++) {
      const byte = this.bytes[endianness === 'be' ? this.position + i : end - 1 - i];
      value = value * 256 + byte;
    }
    this.position = end;
    return value;
  }

  /**
   * Reads `numBytes` bytes (all the remaining ones by default) as a Latin-1 string that stops at the first null byte.
   * The cursor always moves by `numBytes`.
   */
  readString(numBytes?: number): string {
    const bytes = this.getBytes(numBytes);
    const nul = bytes.indexOf(0);
    return String.fromCharCode(...(nul === -1 ? bytes : bytes.subarray(0, nul)));
  }

  moveForwardsBy(numBytes: number): void {
    this.moveTo(this.position + numBytes);
  }

  moveBackwardsBy(numBytes: number): void {
    this.moveTo(this.position - numBytes);
  }

  moveTo(position: number): void {
    if (position < 0 || position > this.length) {
      throw new RangeError(`Cannot move to position ${position} in stream. Out of bounds.`);
    }
    this.position = position;
  }

  /** Skips the next byte if it equals `value`. */
  consumeIf(value: number): void {
    if (this.bytes[this.position] === value) {
      this.position++;
    }
  }

  /** Skips bytes as long as they equal `value`. */
  consumeWhile(value: number): void {
    while (this.position < this.length && this.bytes[this.position] === value) {
      this.position++;
    }
  }

  /** Returns a copy of the bytes from `start` up to `end` (the current position by default). */
  carve(start = 0, end = this.position): Uint8Array {
    return this.bytes.slice(start, end);
  }

  private assertReadable(end: number): void {
    if (end > this.length) {
      throw new RangeError(`Unexpected end of data: needed ${end - this.position} bytes at offset ${this.position}`);
    }
  }
}
