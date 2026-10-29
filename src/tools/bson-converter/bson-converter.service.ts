// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/BSONSerialise.mjs and BSONDeserialise.mjs. Extended
// JSON keeps the BSON types (ObjectId, dates, 64-bit integers...) that plain JSON loses, and a sequence of documents —
// the format of `mongodump` files — is read and written as a JSON array.
import { BSON, EJSON } from 'bson';

export type JsonMode = 'relaxed' | 'canonical';

export function jsonToBson(json: string): Uint8Array {
  if (!json.trim()) {
    return new Uint8Array(0);
  }
  // Not relaxed, so that 64-bit integers stay exact.
  const value: unknown = EJSON.parse(json, { relaxed: false });
  const documents = Array.isArray(value) ? value : [value];
  const parts = documents.map((document, index) => {
    // Numbers parse to BSON types such as Int32, which are objects too.
    if (document === null || typeof document !== 'object' || Array.isArray(document) || '_bsontype' in document) {
      throw new Error(
        Array.isArray(value)
          ? `Item ${index + 1} is not an object: a BSON document must be an object`
          : 'A BSON document must be an object, or an array of objects for several documents',
      );
    }
    return BSON.serialize(document as BSON.Document);
  });
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

/** Splits concatenated BSON documents, each starting with its own length. */
export function readDocuments(bytes: Uint8Array): BSON.Document[] {
  const documents: BSON.Document[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset < bytes.length; ) {
    if (bytes.length - offset < 5) {
      throw new Error(`Truncated document at byte ${offset}`);
    }
    const size = view.getInt32(offset, true);
    if (size < 5 || offset + size > bytes.length) {
      throw new Error(`Invalid document size ${size} at byte ${offset}`);
    }
    documents.push(BSON.deserialize(bytes.subarray(offset, offset + size), { promoteLongs: false }));
    offset += size;
  }
  return documents;
}

export function bsonToJson(bytes: Uint8Array, { mode = 'relaxed' as JsonMode, indent = 2 } = {}): string {
  if (bytes.length === 0) {
    return '';
  }
  const documents = readDocuments(bytes);
  return EJSON.stringify(documents.length === 1 ? documents[0] : documents, undefined, indent, {
    relaxed: mode === 'relaxed',
  });
}
