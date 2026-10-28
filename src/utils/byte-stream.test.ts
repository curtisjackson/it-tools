import { describe, expect, it } from 'vitest';
import { ByteStream } from './byte-stream';

describe('ByteStream', () => {
  const data = new Uint8Array([0x16, 0x03, 0x01, 0x00, 0x05, 0x68, 0x69, 0x00, 0x7a, 0x7a]);

  it('reads big and little endian integers', () => {
    const stream = new ByteStream(data);
    expect(stream.readInt(1)).toBe(0x16);
    expect(stream.readInt(2)).toBe(0x0301);
    expect(stream.position).toBe(3);
    expect(new ByteStream(data, 1).readInt(2, 'le')).toBe(0x0103);
  });

  it('reads 4-byte integers as unsigned', () => {
    expect(new ByteStream(new Uint8Array([0xff, 0xff, 0xff, 0xff])).readInt(4)).toBe(0xffffffff);
  });

  it('reads bytes and the rest', () => {
    const stream = new ByteStream(data, 3);
    expect(stream.getBytes(2)).toEqual(new Uint8Array([0x00, 0x05]));
    expect(stream.getBytes()).toEqual(new Uint8Array([0x68, 0x69, 0x00, 0x7a, 0x7a]));
    expect(stream.hasMore()).toBe(false);
  });

  it('reads strings up to a null byte but moves by the full length', () => {
    const stream = new ByteStream(data, 5);
    expect(stream.readString(4)).toBe('hi');
    expect(stream.position).toBe(9);
  });

  it('throws when reading past the end', () => {
    expect(() => new ByteStream(data, 9).readInt(2)).toThrow('Unexpected end of data');
    expect(() => new ByteStream(data).getBytes(11)).toThrow(RangeError);
  });

  it('moves and clones independently', () => {
    const stream = new ByteStream(data);
    stream.moveForwardsBy(5);
    const copy = stream.clone();
    copy.moveBackwardsBy(2);
    expect(stream.position).toBe(5);
    expect(copy.position).toBe(3);
    expect(() => stream.moveTo(11)).toThrow('Out of bounds');
  });

  it('consumes matching bytes and carves', () => {
    const stream = new ByteStream(new Uint8Array([0, 0, 0, 1, 2]));
    stream.consumeWhile(0);
    expect(stream.position).toBe(3);
    stream.consumeIf(9);
    expect(stream.position).toBe(3);
    stream.consumeIf(1);
    expect(stream.carve()).toEqual(new Uint8Array([0, 0, 0, 1]));
  });
});
