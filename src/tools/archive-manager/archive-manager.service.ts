import { gunzipSync, gzipSync } from 'fflate';
import {
  ERR_ENCRYPTED,
  ERR_INVALID_PASSWORD,
  type Entry,
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipReader,
  ZipWriter,
  configure,
} from '@zip.js/zip.js';
import { type TarEntryKind, isTar, readTar, writeTar } from './tar';

configure({ useWebWorkers: false });

export type ArchiveFormat = 'zip' | 'tar' | 'tar.gz';
export const archiveFormats: ArchiveFormat[] = ['zip', 'tar', 'tar.gz'];

export type ZipEncryption = 'aes' | 'zip-crypto';

// Legacy encodings of zip filenames written without the UTF-8 flag: zip.js falls back to CP437,
// but Windows writes them in the OEM code page of its locale.
export const filenameEncodings = ['auto', 'ibm866', 'windows-1251', 'shift_jis', 'gbk'] as const;
export type FilenameEncoding = (typeof filenameEncodings)[number];

export interface ArchiveEntry {
  path: string;
  kind: TarEntryKind;
  size: number;
  compressedSize?: number;
  modified?: Date;
  encrypted: boolean;
  linkTarget?: string;
  read: (password?: string) => Promise<Uint8Array>;
}

export interface OpenedArchive {
  format: ArchiveFormat | 'gzip';
  entries: ArchiveEntry[];
  comment?: string;
}

export interface ArchiveInput {
  path: string;
  data: Uint8Array;
  modified?: Date;
}

export interface CreateOptions {
  // Deflate level for zip and gzip, 0 stores zip entries without compression.
  level: number;
  password: string;
  encryption: ZipEncryption;
  comment: string;
}

export const defaultCreateOptions: CreateOptions = { level: 6, password: '', encryption: 'aes', comment: '' };

export const archiveExtensions: Record<ArchiveFormat, string> = { zip: 'zip', tar: 'tar', 'tar.gz': 'tar.gz' };

function isZip(bytes: Uint8Array) {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && [3, 5, 7].includes(bytes[2]) && [4, 6, 8].includes(bytes[3]);
}

function isGzip(bytes: Uint8Array) {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

// The original file name stored in a gzip header (FNAME flag), if any.
function gzipName(bytes: Uint8Array): string | undefined {
  const flags = bytes[3];
  if (!(flags & 8)) {
    return undefined;
  }
  let offset = 10;
  if (flags & 4) {
    offset += 2 + (bytes[10] | (bytes[11] << 8));
  }
  const end = bytes.indexOf(0, offset);
  return end === -1 ? undefined : new TextDecoder('latin1').decode(bytes.subarray(offset, end));
}

function zipError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message === ERR_INVALID_PASSWORD) {
    return new Error('Wrong password');
  }
  if (message === ERR_ENCRYPTED) {
    return new Error('This file is encrypted: enter the password');
  }
  return error instanceof Error ? error : new Error(message);
}

async function openZip(bytes: Uint8Array, filenameEncoding: FilenameEncoding): Promise<OpenedArchive> {
  const reader = new ZipReader(new Uint8ArrayReader(bytes), {
    filenameEncoding: filenameEncoding === 'auto' ? undefined : filenameEncoding,
    commentEncoding: filenameEncoding === 'auto' ? undefined : filenameEncoding,
  });
  let entries: Entry[];
  try {
    entries = await reader.getEntries();
  } catch (error) {
    throw zipError(error);
  }
  const comment = reader.comment?.length ? new TextDecoder().decode(reader.comment) : undefined;
  return {
    format: 'zip',
    comment,
    entries: entries.map((entry) => ({
      path: entry.filename,
      kind: entry.directory ? 'directory' : 'file',
      size: entry.uncompressedSize,
      compressedSize: entry.compressedSize,
      modified: entry.lastModDate,
      encrypted: entry.encrypted,
      read: async (password) => {
        if (entry.directory) {
          return new Uint8Array();
        }
        try {
          return await entry.getData(new Uint8ArrayWriter(), { password: password || undefined, checkSignature: true });
        } catch (error) {
          throw zipError(error);
        }
      },
    })),
  };
}

function tarEntries(bytes: Uint8Array): ArchiveEntry[] {
  return readTar(bytes).map((entry) => ({
    path: entry.path,
    kind: entry.kind,
    size: entry.size,
    modified: entry.modified,
    encrypted: false,
    linkTarget: entry.linkTarget,
    read: async () => entry.data,
  }));
}

export async function openArchive(
  bytes: Uint8Array,
  { fileName = '', filenameEncoding = 'auto' }: { fileName?: string; filenameEncoding?: FilenameEncoding } = {},
): Promise<OpenedArchive> {
  if (isZip(bytes)) {
    return openZip(bytes, filenameEncoding);
  }
  if (isGzip(bytes)) {
    let inner: Uint8Array;
    try {
      inner = gunzipSync(bytes);
    } catch (error) {
      throw new Error(`Invalid gzip data: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (isTar(inner)) {
      return { format: 'tar.gz', entries: tarEntries(inner) };
    }
    const name = gzipName(bytes) ?? (fileName.replace(/\.gz$/i, '') || 'data');
    return {
      format: 'gzip',
      entries: [
        {
          path: name,
          kind: 'file',
          size: inner.length,
          compressedSize: bytes.length,
          encrypted: false,
          read: async () => inner,
        },
      ],
    };
  }
  if (isTar(bytes)) {
    return { format: 'tar', entries: tarEntries(bytes) };
  }
  throw new Error('This is not a ZIP, TAR or gzip archive');
}

export async function createArchive(
  files: ArchiveInput[],
  format: ArchiveFormat,
  options: Partial<CreateOptions> = {},
): Promise<Uint8Array> {
  const { level, password, encryption, comment } = { ...defaultCreateOptions, ...options };
  if (format === 'tar' || format === 'tar.gz') {
    const tar = writeTar(files);
    return format === 'tar' ? tar : gzipSync(tar, { level: Math.min(9, Math.max(1, level)) as 1 });
  }
  const writer = new ZipWriter(new Uint8ArrayWriter(), {
    level,
    password: password || undefined,
    zipCrypto: password ? encryption === 'zip-crypto' : undefined,
    encryptionStrength: 3,
  });
  for (const file of files) {
    await writer.add(file.path, file.path.endsWith('/') ? undefined : new Uint8ArrayReader(file.data), {
      directory: file.path.endsWith('/'),
      lastModDate: file.modified,
    });
  }
  return writer.close(comment ? new TextEncoder().encode(comment) : undefined);
}
