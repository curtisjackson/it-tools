// Reads and writes tar archives: POSIX ustar with the name prefix, pax extended headers,
// GNU long names, base-256 numbers and the old v7 format. Every header checksum is verified.

const BLOCK = 512;
const RECORD = 20 * BLOCK;

export type TarEntryKind = 'file' | 'directory' | 'symlink' | 'hardlink' | 'other';

export interface TarEntry {
  path: string;
  kind: TarEntryKind;
  size: number;
  mode: number;
  modified: Date;
  linkTarget?: string;
  data: Uint8Array;
}

export interface TarInput {
  path: string;
  data: Uint8Array;
  modified?: Date;
}

const utf8 = new TextDecoder('utf-8', { fatal: true });
const latin1 = new TextDecoder('latin1');

function decodeName(bytes: Uint8Array) {
  try {
    return utf8.decode(bytes);
  } catch {
    return latin1.decode(bytes);
  }
}

function field(header: Uint8Array, offset: number, length: number) {
  const bytes = header.subarray(offset, offset + length);
  const end = bytes.indexOf(0);
  return end === -1 ? bytes : bytes.subarray(0, end);
}

function readString(header: Uint8Array, offset: number, length: number) {
  return decodeName(field(header, offset, length));
}

function readNumber(header: Uint8Array, offset: number, length: number): number {
  // GNU base-256: the high bit of the first byte is set.
  if (header[offset] & 0x80) {
    let value = header[offset] & 0x3f;
    for (let i = 1; i < length; i++) {
      value = value * 256 + header[offset + i];
    }
    return header[offset] & 0x40 ? value - 2 ** ((length - 1) * 8 + 6) : value;
  }
  const text = latin1.decode(field(header, offset, length)).trim();
  if (text === '') {
    return 0;
  }
  if (!/^[0-7]+$/.test(text)) {
    throw new Error(`Invalid number "${text}" in a tar header`);
  }
  return Number.parseInt(text, 8);
}

function checksums(header: Uint8Array) {
  let unsigned = 0;
  let signed = 0;
  for (let i = 0; i < BLOCK; i++) {
    const byte = i >= 148 && i < 156 ? 0x20 : header[i];
    unsigned += byte;
    signed += byte > 127 ? byte - 256 : byte;
  }
  return { unsigned, signed };
}

// Pax records are "<length> <key>=<value>\n", where the length counts the whole record in bytes.
function parsePax(data: Uint8Array): Record<string, string> {
  const records: Record<string, string> = {};
  let offset = 0;
  while (offset < data.length) {
    const space = data.indexOf(0x20, offset);
    if (space === -1) {
      break;
    }
    const length = Number.parseInt(latin1.decode(data.subarray(offset, space)), 10);
    if (!Number.isInteger(length) || length <= 0 || offset + length > data.length) {
      throw new Error('Invalid pax extended header');
    }
    const record = utf8.decode(data.subarray(space + 1, offset + length - 1));
    const equals = record.indexOf('=');
    if (equals > 0) {
      records[record.slice(0, equals)] = record.slice(equals + 1);
    }
    offset += length;
  }
  return records;
}

function kindOf(type: string): TarEntryKind {
  switch (type) {
    case '0':
    case '\0':
    case '7':
      return 'file';
    case '5':
      return 'directory';
    case '2':
      return 'symlink';
    case '1':
      return 'hardlink';
    default:
      return 'other';
  }
}

export function isTar(bytes: Uint8Array): boolean {
  if (bytes.length < BLOCK) {
    return false;
  }
  const header = bytes.subarray(0, BLOCK);
  try {
    const stored = readNumber(header, 148, 8);
    const { unsigned, signed } = checksums(header);
    return stored === unsigned || stored === signed;
  } catch {
    return false;
  }
}

export function readTar(bytes: Uint8Array): TarEntry[] {
  const entries: TarEntry[] = [];
  let global: Record<string, string> = {};
  let local: Record<string, string> = {};
  let longName: string | undefined;
  let longLink: string | undefined;
  let offset = 0;

  while (offset + BLOCK <= bytes.length) {
    const header = bytes.subarray(offset, offset + BLOCK);
    if (header.every((byte) => byte === 0)) {
      break;
    }
    const stored = readNumber(header, 148, 8);
    const { unsigned, signed } = checksums(header);
    if (stored !== unsigned && stored !== signed) {
      throw new Error(`Wrong tar header checksum at offset ${offset}`);
    }

    const type = String.fromCharCode(header[156]);
    const pax = { ...global, ...local };
    const size = pax.size !== undefined ? Number(pax.size) : readNumber(header, 124, 12);
    const dataStart = offset + BLOCK;
    if (dataStart + size > bytes.length) {
      throw new Error('The tar archive is truncated');
    }
    const data = bytes.subarray(dataStart, dataStart + size);
    offset = dataStart + Math.ceil(size / BLOCK) * BLOCK;

    if (type === 'x' || type === 'g') {
      if (type === 'g') {
        global = { ...global, ...parsePax(data) };
      } else {
        local = parsePax(data);
      }
      continue;
    }
    if (type === 'L' || type === 'K') {
      const name = decodeName(field(data, 0, data.length));
      if (type === 'L') {
        longName = name;
      } else {
        longLink = name;
      }
      continue;
    }

    // "ustar\0" is POSIX, with the name prefix; GNU writes "ustar  \0" and uses those bytes for other fields.
    const posix = latin1.decode(header.subarray(257, 263)) === 'ustar\0';
    const prefix = posix ? readString(header, 345, 155) : '';
    const name = readString(header, 0, 100);
    const path = pax.path ?? longName ?? (prefix ? `${prefix}/${name}` : name);
    const linkTarget = pax.linkpath ?? longLink ?? readString(header, 157, 100);
    const mtime = pax.mtime !== undefined ? Number(pax.mtime) : readNumber(header, 136, 12);
    const kind = kindOf(type);
    entries.push({
      path,
      kind: kind === 'file' && path.endsWith('/') ? 'directory' : kind,
      size: kind === 'file' ? size : 0,
      mode: readNumber(header, 100, 8),
      modified: new Date(mtime * 1000),
      linkTarget: kind === 'symlink' || kind === 'hardlink' ? linkTarget : undefined,
      data: kind === 'file' ? data : new Uint8Array(),
    });
    local = {};
    longName = undefined;
    longLink = undefined;
  }
  return entries;
}

const encoder = new TextEncoder();

function writeString(header: Uint8Array, offset: number, length: number, value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  header.set(bytes.subarray(0, length), offset);
}

function writeOctal(header: Uint8Array, offset: number, length: number, value: number) {
  writeString(header, offset, length, `${value.toString(8).padStart(length - 1, '0')}\0`);
}

function makeHeader(name: Uint8Array, prefix: Uint8Array, type: string, size: number, modified: Date, mode: number) {
  const header = new Uint8Array(BLOCK);
  writeString(header, 0, 100, name);
  writeOctal(header, 100, 8, mode);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, Math.max(0, Math.floor(modified.getTime() / 1000)));
  header[156] = type.charCodeAt(0);
  writeString(header, 257, 8, 'ustar\x0000');
  writeString(header, 345, 155, prefix);
  const { unsigned } = checksums(header);
  writeString(header, 148, 8, `${unsigned.toString(8).padStart(6, '0')}\0 `);
  return header;
}

// Splits a path into the ustar prefix and name fields, at a slash.
function splitPath(path: Uint8Array): [Uint8Array, Uint8Array] | undefined {
  if (path.length <= 100) {
    return [new Uint8Array(), path];
  }
  for (let i = path.length - 1; i > 0; i--) {
    if (path[i] === 0x2f && i <= 155 && path.length - i - 1 <= 100 && path.length - i - 1 > 0) {
      return [path.subarray(0, i), path.subarray(i + 1)];
    }
  }
  return undefined;
}

function paxRecord(key: string, value: string) {
  const body = encoder.encode(` ${key}=${value}\n`);
  let length = body.length + 1;
  while (String(length).length + body.length !== length) {
    length = String(length).length + body.length;
  }
  return encoder.encode(`${length}${` ${key}=${value}\n`}`);
}

function padded(data: Uint8Array) {
  const blocks = new Uint8Array(Math.ceil(data.length / BLOCK) * BLOCK);
  blocks.set(data);
  return blocks;
}

// Writes a POSIX tar: plain ustar headers when the path fits and is ASCII, with a pax header otherwise,
// as GNU tar --format=posix does.
export function writeTar(files: TarInput[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const { path, data, modified = new Date() } of files) {
    const pathBytes = encoder.encode(path);
    const ascii = pathBytes.every((byte) => byte < 0x80);
    const split = ascii ? splitPath(pathBytes) : undefined;
    const isDirectory = path.endsWith('/');
    if (!split) {
      const pax = paxRecord('path', path);
      parts.push(makeHeader(encoder.encode('PaxHeader'), new Uint8Array(), 'x', pax.length, modified, 0o644));
      parts.push(padded(pax));
    }
    const [prefix, name] = split ?? [new Uint8Array(), pathBytes.subarray(-100)];
    parts.push(
      makeHeader(
        name,
        prefix,
        isDirectory ? '5' : '0',
        isDirectory ? 0 : data.length,
        modified,
        isDirectory ? 0o755 : 0o644,
      ),
    );
    if (!isDirectory) {
      parts.push(padded(data));
    }
  }
  const length = parts.reduce((sum, part) => sum + part.length, 0) + 2 * BLOCK;
  const tar = new Uint8Array(Math.ceil(length / RECORD) * RECORD);
  let offset = 0;
  for (const part of parts) {
    tar.set(part, offset);
    offset += part.length;
  }
  return tar;
}
