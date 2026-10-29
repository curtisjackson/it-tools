// A parser of TLS ClientHello and ServerHello messages, for the fingerprints. CyberChef (Apache-2.0) v11.5.0 parses them
// inline in src/core/operations/JA3Fingerprint.mjs and JA3SFingerprint.mjs and only accepts exactly one record; this
// one also joins a handshake split over several records, accepts a handshake without its record header and ignores
// the data that follows.
import { ByteStream } from '@/utils/byte-stream';

export interface TlsExtension {
  type: number;
  data: Uint8Array;
}

export interface TlsHello {
  kind: 'client' | 'server';
  /** `legacy_version` of the hello, e.g. 0x0303 for TLS 1.2 and 1.3. */
  version: number;
  sessionId: Uint8Array;
  /** All the offered cipher suites for a ClientHello, the chosen one for a ServerHello. */
  cipherSuites: number[];
  compressionMethods: number[];
  extensions: TlsExtension[];
}

export const TLS_EXTENSION = {
  SERVER_NAME: 0x0000,
  SUPPORTED_GROUPS: 0x000a,
  EC_POINT_FORMATS: 0x000b,
  SIGNATURE_ALGORITHMS: 0x000d,
  ALPN: 0x0010,
  SUPPORTED_VERSIONS: 0x002b,
} as const;

/** GREASE values (RFC 8701): 0x0a0a, 0x1a1a ... 0xfafa. */
export const isGrease = (value: number) => (value & 0x0f0f) === 0x0a0a && value >> 8 === (value & 0xff);

/** Extracts the handshake message from one or more TLS records, or takes the input as a bare handshake. */
export function handshakeBytes(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0x16 || bytes[1] !== 0x03) {
    return bytes;
  }
  const stream = new ByteStream(bytes);
  const fragments: Uint8Array[] = [];
  let total = 0;
  let needed = Number.POSITIVE_INFINITY;
  while (stream.hasMore() && total < needed) {
    if (stream.length - stream.position < 5) {
      throw new Error(`Truncated TLS record header at byte ${stream.position}`);
    }
    const contentType = stream.readInt(1);
    if (contentType !== 0x16) {
      break;
    }
    stream.moveForwardsBy(2);
    const length = stream.readInt(2);
    if (stream.length - stream.position < length) {
      throw new Error(`The TLS record at byte ${stream.position - 5} is truncated: ${length} bytes announced`);
    }
    const fragment = stream.getBytes(length);
    fragments.push(fragment);
    total += fragment.length;
    if (fragments.length === 1 && fragment.length >= 4) {
      needed = 4 + ((fragment[1] << 16) | (fragment[2] << 8) | fragment[3]);
    }
  }
  const handshake = new Uint8Array(total);
  let offset = 0;
  for (const fragment of fragments) {
    handshake.set(fragment, offset);
    offset += fragment.length;
  }
  return handshake;
}

function readList(stream: ByteStream, lengthSize: number, itemSize: number): number[] {
  const list = new ByteStream(stream.getBytes(stream.readInt(lengthSize)));
  const items: number[] = [];
  while (list.hasMore()) {
    items.push(list.readInt(itemSize));
  }
  return items;
}

export function parseTlsHello(input: Uint8Array): TlsHello {
  const bytes = handshakeBytes(input);
  if (bytes.length < 4) {
    throw new Error('Not a TLS handshake: too short');
  }
  const type = bytes[0];
  if (type !== 1 && type !== 2) {
    throw new Error(`Not a ClientHello or ServerHello: handshake type ${type}`);
  }
  const length = (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  if (bytes.length < length + 4) {
    throw new Error(`The handshake is truncated: ${length} bytes announced, ${bytes.length - 4} available`);
  }
  const stream = new ByteStream(bytes.subarray(4, 4 + length));
  const version = stream.readInt(2);
  stream.moveForwardsBy(32);
  const sessionId = stream.getBytes(stream.readInt(1));
  const kind = type === 1 ? 'client' : 'server';
  const cipherSuites = kind === 'client' ? readList(stream, 2, 2) : [stream.readInt(2)];
  const compressionMethods = kind === 'client' ? readList(stream, 1, 1) : [stream.readInt(1)];
  const extensions: TlsExtension[] = [];
  if (stream.hasMore()) {
    const block = new ByteStream(stream.getBytes(stream.readInt(2)));
    while (block.hasMore()) {
      const extensionType = block.readInt(2);
      extensions.push({ type: extensionType, data: block.getBytes(block.readInt(2)) });
    }
  }
  return { kind, version, sessionId, cipherSuites, compressionMethods, extensions };
}

export function extension(hello: TlsHello, type: number): Uint8Array | undefined {
  return hello.extensions.find((item) => item.type === type)?.data;
}

/** A list of numbers inside an extension, prefixed by its length in bytes. */
export function extensionList(hello: TlsHello, type: number, lengthSize: number, itemSize: number): number[] {
  const data = extension(hello, type);
  return data ? readList(new ByteStream(data), lengthSize, itemSize) : [];
}

export function serverName(hello: TlsHello): string | undefined {
  const data = extension(hello, TLS_EXTENSION.SERVER_NAME);
  if (!data || data.length < 5) {
    return undefined;
  }
  const stream = new ByteStream(data, 2);
  return stream.readInt(1) === 0 ? stream.readString(stream.readInt(2)) : undefined;
}

export function alpnProtocols(hello: TlsHello): string[] {
  const data = extension(hello, TLS_EXTENSION.ALPN);
  if (!data) {
    return [];
  }
  const stream = new ByteStream(data);
  const list = new ByteStream(stream.getBytes(stream.readInt(2)));
  const protocols: string[] = [];
  while (list.hasMore()) {
    protocols.push(String.fromCharCode(...list.getBytes(list.readInt(1))));
  }
  return protocols;
}

/** The versions of the supported_versions extension: offered by a client, chosen by a server. */
export function supportedVersions(hello: TlsHello): number[] {
  const data = extension(hello, TLS_EXTENSION.SUPPORTED_VERSIONS);
  if (!data) {
    return [];
  }
  return hello.kind === 'client' ? readList(new ByteStream(data), 1, 2) : [new ByteStream(data).readInt(2)];
}
