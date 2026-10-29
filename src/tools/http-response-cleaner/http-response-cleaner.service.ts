// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/StripHTTPHeaders.mjs and DechunkHTTPResponse.mjs.
// Works on bytes, so a binary body survives (CyberChef sliced strings), reads the headers to know whether the body is
// chunked and compressed, handles chunk extensions and trailers, and decompresses gzip and deflate bodies.
import { gunzipSync, inflateSync, unzlibSync } from 'fflate';

export type DechunkMode = 'auto' | 'always' | 'never';

export interface HttpCleanOptions {
  dechunk: DechunkMode;
  decompress: boolean;
}

export interface HttpCleanResult {
  /** `HTTP/1.1 200 OK`, or undefined when the input has no headers. */
  startLine?: string;
  headers: [string, string][];
  body: Uint8Array;
  /** What was done to the body, in order. */
  steps: ('dechunked' | 'gzip' | 'deflate')[];
}

const latin1 = new TextDecoder('latin1');

function indexOfBytes(bytes: Uint8Array, pattern: number[], from = 0): number {
  for (let i = from; i <= bytes.length - pattern.length; i++) {
    if (pattern.every((byte, offset) => bytes[i + offset] === byte)) {
      return i;
    }
  }
  return -1;
}

/** Splits the start line and the headers from the body, when the input starts like an HTTP message. */
export function splitHttpMessage(bytes: Uint8Array): { head?: string; body: Uint8Array } {
  const start = latin1.decode(bytes.subarray(0, 200));
  if (!/^(?:HTTP\/\d(?:\.\d)?\s|[A-Z]+ \S+ HTTP\/\d)/.test(start)) {
    return { body: bytes };
  }
  const crlf = indexOfBytes(bytes, [13, 10, 13, 10]);
  const lf = indexOfBytes(bytes, [10, 10]);
  const [end, length] = crlf >= 0 && (lf < 0 || crlf < lf) ? [crlf, 4] : lf >= 0 ? [lf, 2] : [bytes.length, 0];
  return { head: latin1.decode(bytes.subarray(0, end)), body: bytes.subarray(end + length) };
}

export function parseHead(head: string): { startLine: string; headers: [string, string][] } {
  const [startLine, ...lines] = head.split(/\r?\n/);
  const headers: [string, string][] = [];
  for (const line of lines) {
    // A line starting with whitespace continues the previous header (obsolete folding).
    if (/^[ \t]/.test(line) && headers.length > 0) {
      headers[headers.length - 1][1] += ` ${line.trim()}`;
      continue;
    }
    const colon = line.indexOf(':');
    if (colon > 0) {
      headers.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()]);
    }
  }
  return { startLine, headers };
}

const CHUNK_SIZE = /^[0-9A-Fa-f]+(?:[ \t]*;[^\r\n]*)?\r?$/;

export function looksChunked(body: Uint8Array): boolean {
  const lineEnd = body.indexOf(10);
  return lineEnd > 0 && lineEnd < 100 && CHUNK_SIZE.test(latin1.decode(body.subarray(0, lineEnd)));
}

/** Joins the chunks of a `Transfer-Encoding: chunked` body; the trailers after the last chunk are dropped. */
export function dechunk(body: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  for (;;) {
    const lineEnd = body.indexOf(10, position);
    if (lineEnd < 0) {
      throw new Error(`Missing the size of the chunk at byte ${position}`);
    }
    const line = latin1.decode(body.subarray(position, lineEnd));
    if (!CHUNK_SIZE.test(line)) {
      throw new Error(`Invalid chunk size "${line.trim()}" at byte ${position}`);
    }
    const size = Number.parseInt(line, 16);
    position = lineEnd + 1;
    if (size === 0) {
      break;
    }
    if (position + size > body.length) {
      throw new Error(
        `The chunk at byte ${position} is truncated: ${size} bytes announced, ${body.length - position} left`,
      );
    }
    chunks.push(body.subarray(position, position + size));
    position += size;
    // The line break after the data.
    if (body[position] === 13) {
      position++;
    }
    if (body[position] === 10) {
      position++;
    }
  }
  const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function decode(body: Uint8Array, encoding: string): Uint8Array {
  switch (encoding) {
    case 'gzip':
    case 'x-gzip':
      return gunzipSync(body);
    case 'deflate':
      // `deflate` should be zlib-wrapped, but some servers send raw deflate.
      try {
        return unzlibSync(body);
      } catch {
        return inflateSync(body);
      }
    default:
      throw new Error(`The "${encoding}" content encoding is not supported`);
  }
}

const header = (headers: [string, string][], name: string) =>
  headers.find(([key]) => key.toLowerCase() === name)?.[1].toLowerCase() ?? '';

export function cleanHttpResponse(
  bytes: Uint8Array,
  { dechunk: dechunkMode, decompress }: HttpCleanOptions,
): HttpCleanResult {
  const { head, body: rawBody } = splitHttpMessage(bytes);
  const { startLine, headers } = head === undefined ? { startLine: undefined, headers: [] } : parseHead(head);
  const steps: HttpCleanResult['steps'] = [];
  let body = rawBody;

  const chunked =
    dechunkMode === 'always' ||
    (dechunkMode === 'auto' &&
      (head === undefined ? looksChunked(body) : header(headers, 'transfer-encoding').includes('chunked')));
  if (chunked && body.length > 0) {
    body = dechunk(body);
    steps.push('dechunked');
  }

  if (decompress && body.length > 0) {
    const encodings = header(headers, 'content-encoding')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value && value !== 'identity');
    // Without headers, a gzip body is recognised by its magic number.
    if (head === undefined && body[0] === 0x1f && body[1] === 0x8b) {
      encodings.push('gzip');
    }
    // The encodings are listed in the order they were applied.
    for (const encoding of encodings.reverse()) {
      body = decode(body, encoding);
      steps.push(encoding === 'deflate' ? 'deflate' : 'gzip');
    }
  }

  return { startLine, headers, body, steps };
}

/** The charset of the Content-Type header, if TextDecoder knows it. */
export function bodyCharset(headers: [string, string][]): string {
  const charset = /charset=["']?([\w-]+)/i.exec(header(headers, 'content-type'))?.[1] ?? 'utf-8';
  try {
    return new TextDecoder(charset).encoding;
  } catch {
    return 'utf-8';
  }
}

/** Decodes the body as text, or returns undefined when it looks binary. */
export function bodyText(body: Uint8Array, charset = 'utf-8'): string | undefined {
  if (body.subarray(0, 4096).includes(0)) {
    return undefined;
  }
  try {
    return new TextDecoder(charset, { fatal: charset === 'utf-8' }).decode(body);
  } catch {
    return undefined;
  }
}
