import { describe, expect, it } from 'vitest';
import { bsonToJson, jsonToBson } from './bson-converter.service';
import { bytesToHex, latin1ToBytes } from '@/utils/bytes';

// Test vector of CyberChef's BSON tests.
const helloWorld = '\x16\x00\x00\x00\x02hello\x00\x06\x00\x00\x00world\x00\x00';

describe('bson-converter', () => {
  describe('jsonToBson', () => {
    it('serializes a document', () => {
      expect(jsonToBson('{"hello":"world"}')).toEqual(latin1ToBytes(helloWorld));
    });

    it('keeps the Extended JSON types', () => {
      const bytes = jsonToBson(
        '{"_id": {"$oid": "64b7f0c2a1b2c3d4e5f60718"}, "big": {"$numberLong": "9223372036854775807"}, "at": {"$date": "2024-01-02T03:04:05Z"}}',
      );
      expect(bsonToJson(bytes, { mode: 'canonical', indent: 0 })).toBe(
        '{"_id":{"$oid":"64b7f0c2a1b2c3d4e5f60718"},"big":{"$numberLong":"9223372036854775807"},"at":{"$date":{"$numberLong":"1704164645000"}}}',
      );
    });

    it('writes an array as a sequence of documents', () => {
      const bytes = jsonToBson('[{"a": 1}, {"b": "тест"}]');
      expect(bsonToJson(bytes, { indent: 0 })).toBe('[{"a":1},{"b":"тест"}]');
    });

    it('rejects values that are not documents', () => {
      expect(() => jsonToBson('42')).toThrow('A BSON document must be an object');
      expect(() => jsonToBson('[{"a": 1}, 2]')).toThrow('Item 2 is not an object');
      expect(() => jsonToBson('{"a":')).toThrow();
    });

    it('returns nothing for an empty input', () => {
      expect(jsonToBson(' ')).toHaveLength(0);
    });
  });

  describe('bsonToJson', () => {
    it('deserializes a document', () => {
      expect(bsonToJson(latin1ToBytes(helloWorld))).toBe('{\n  "hello": "world"\n}');
    });

    it('writes relaxed or canonical Extended JSON', () => {
      const bytes = jsonToBson('{"n": 1, "f": 1.5}');
      expect(bsonToJson(bytes, { mode: 'relaxed', indent: 0 })).toBe('{"n":1,"f":1.5}');
      expect(bsonToJson(bytes, { mode: 'canonical', indent: 0 })).toBe(
        '{"n":{"$numberInt":"1"},"f":{"$numberDouble":"1.5"}}',
      );
    });

    it('rejects truncated or corrupted data', () => {
      const bytes = latin1ToBytes(helloWorld);
      expect(() => bsonToJson(bytes.subarray(0, 10))).toThrow('Invalid document size 22 at byte 0');
      expect(() => bsonToJson(new Uint8Array([...bytes, 1, 2]))).toThrow('Truncated document at byte 22');
      expect(bytesToHex(bytes)).toBe('160000000268656c6c6f0006000000776f726c640000');
    });

    it('returns nothing for empty data', () => {
      expect(bsonToJson(new Uint8Array(0))).toBe('');
    });
  });
});
