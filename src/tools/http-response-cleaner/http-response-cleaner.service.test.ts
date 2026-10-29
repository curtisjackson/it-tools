import { gzipSync, zlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { bodyCharset, bodyText, cleanHttpResponse, dechunk } from './http-response-cleaner.service';

const encoder = new TextEncoder();
const bytes = (text: string) => encoder.encode(text);
const text = (data: Uint8Array) => new TextDecoder().decode(data);
const concat = (...parts: Uint8Array[]) => new Uint8Array(parts.flatMap((part) => [...part]));
const auto = { dechunk: 'auto' as const, decompress: true };

describe('http-response-cleaner', () => {
  // Test vectors of CyberChef's DechunkHTTPResponse tests.
  it.each([
    ['7\r\nMozilla\r\n9\r\nDeveloper\r\n7\r\nNetwork\r\n0\r\n\r\n', 'MozillaDeveloperNetwork'],
    ['7\nMozilla\n9\nDeveloper\n7\nNetwork\n0\n\n', 'MozillaDeveloperNetwork'],
    ['5\r\nHello\r\n0\r\n\r\n', 'Hello'],
    ['7\nMozilla\n9\nDeveloper\n7\nNetwork\n0\nExpires: Wed, 21 Oct 2015 07:28:00 GMT\n', 'MozillaDeveloperNetwork'],
    ['a\r\n0123456789\r\n0\r\n\r\n', '0123456789'],
  ])('dechunks %j', (input, expected) => {
    expect(text(dechunk(bytes(input)))).toBe(expected);
  });

  it('handles chunk extensions and rejects broken chunks', () => {
    expect(text(dechunk(bytes('5;name=value\r\nHello\r\n0\r\n\r\n')))).toBe('Hello');
    expect(() => dechunk(bytes('zz\r\nHello\r\n'))).toThrow('Invalid chunk size "zz"');
    expect(() => dechunk(bytes('10\r\nHello\r\n'))).toThrow('truncated: 16 bytes announced');
  });

  it('strips the headers and reads them', () => {
    const result = cleanHttpResponse(
      bytes('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nX-Long: a\r\n  b\r\n\r\nBody'),
      auto,
    );
    expect(result.startLine).toBe('HTTP/1.1 200 OK');
    expect(result.headers).toEqual([
      ['Content-Type', 'text/plain'],
      ['X-Long', 'a b'],
    ]);
    expect(text(result.body)).toBe('Body');
    expect(result.steps).toEqual([]);
  });

  it('dechunks and gunzips the body according to the headers, keeping binary data', () => {
    const payload = new Uint8Array([0, 1, 2, 255, 254, 13, 10, 13, 10, 7]);
    const gzipped = gzipSync(payload);
    const response = concat(
      bytes('HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Encoding: gzip\r\n\r\n'),
      bytes(`${(5).toString(16)}\r\n`),
      gzipped.subarray(0, 5),
      bytes(`\r\n${(gzipped.length - 5).toString(16)}\r\n`),
      gzipped.subarray(5),
      bytes('\r\n0\r\n\r\n'),
    );
    const result = cleanHttpResponse(response, auto);
    expect(result.steps).toEqual(['dechunked', 'gzip']);
    expect(result.body).toEqual(payload);
  });

  it('inflates zlib and raw deflate bodies', () => {
    const body = zlibSync(bytes('deflated'));
    const response = concat(bytes('HTTP/1.1 200 OK\nContent-Encoding: deflate\n\n'), body);
    expect(text(cleanHttpResponse(response, auto).body)).toBe('deflated');
    expect(() =>
      cleanHttpResponse(concat(bytes('HTTP/1.1 200 OK\nContent-Encoding: br\n\n'), bytes('x')), auto),
    ).toThrow('"br" content encoding is not supported');
  });

  it('follows the options', () => {
    const response = bytes('HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nHello\r\n0\r\n\r\n');
    expect(text(cleanHttpResponse(response, { dechunk: 'never', decompress: true }).body)).toBe(
      '5\r\nHello\r\n0\r\n\r\n',
    );
    expect(text(cleanHttpResponse(bytes('5\r\nHello\r\n0\r\n\r\n'), auto).body)).toBe('Hello');
    expect(text(cleanHttpResponse(bytes('plain body'), auto).body)).toBe('plain body');
    expect(text(cleanHttpResponse(gzipSync(bytes('magic')), auto).body)).toBe('magic');
    expect(cleanHttpResponse(gzipSync(bytes('magic')), { dechunk: 'auto', decompress: false }).steps).toEqual([]);
  });

  it('decodes the body as text with the charset of the headers', () => {
    expect(bodyCharset([['Content-Type', 'text/html; charset=windows-1251']])).toBe('windows-1251');
    expect(bodyCharset([['Content-Type', 'text/html; charset=unknown']])).toBe('utf-8');
    expect(bodyText(new Uint8Array([0xcf, 0xf0, 0xe8]), 'windows-1251')).toBe('При');
    expect(bodyText(new Uint8Array([0xff, 0xfe, 0x41]))).toBeUndefined();
    expect(bodyText(new Uint8Array([65, 0, 66]))).toBeUndefined();
  });
});
