import { parseBuffer } from 'music-metadata';
import { describe, expect, it } from 'vitest';
import { AIFF, FLAC, MP3, OPUS, WAV, WMA } from './audio-metadata.samples';
import {
  commonRows,
  formatDuration,
  formatRows,
  metadataToJson,
  nativeRows,
  tagValueToString,
} from './audio-metadata.service';
import { hexToBytes } from '@/utils/bytes';

const parse = (hex: string, mimeType: string) => {
  const bytes = hexToBytes(hex);
  return parseBuffer(bytes, { mimeType, size: bytes.length });
};

describe('audio-metadata', () => {
  it.each([
    ['MP3', MP3, 'audio/mpeg', 'ID3v2.4'],
    ['FLAC', FLAC, 'audio/flac', 'vorbis'],
    ['Opus', OPUS, 'audio/ogg', 'vorbis'],
    ['WMA', WMA, 'audio/x-ms-wma', 'asf'],
  ])('reads the title and artist of %s', async (_, hex, mimeType, tagType) => {
    const metadata = await parse(hex, mimeType);
    expect(commonRows(metadata.common)).toEqual(
      expect.arrayContaining([
        ['title', 'Galway'],
        ['artist', 'Kevin MacLeod'],
      ]),
    );
    expect(nativeRows(metadata).map(({ type }) => type)).toContain(tagType);
  });

  it('lists the ID3v2 frames', async () => {
    const [id3] = nativeRows(await parse(MP3, 'audio/mpeg'));
    expect(id3.rows).toEqual([
      ['TIT2', 'Galway'],
      ['TPE1', 'Kevin MacLeod'],
      ['TSSE', 'Lavf56.40.101'],
    ]);
  });

  it('reads the format of FLAC and WAV', async () => {
    expect(formatRows((await parse(FLAC, 'audio/flac')).format)).toEqual(
      expect.arrayContaining([
        ['container', 'FLAC'],
        ['sampleRate', '44100 Hz'],
        ['lossless', 'true'],
      ]),
    );
    expect(formatRows((await parse(WAV, 'audio/wav')).format)).toEqual(
      expect.arrayContaining([
        ['container', 'WAVE'],
        ['codec', 'PCM'],
      ]),
    );
  });

  it('reads the AIFF name chunk', async () => {
    expect(commonRows((await parse(AIFF, 'audio/aiff')).common)).toContainEqual(['title', 'Galway']);
  });

  it('formats durations and tag values', () => {
    expect(formatDuration(65.4321)).toBe('1:05.432');
    expect(formatDuration(3725)).toBe('1:02:05.000');
    expect(tagValueToString({ no: 3, of: 12 })).toBe('3/12');
    expect(tagValueToString({ no: null, of: null })).toBe('');
    expect(tagValueToString([{ descriptor: 'iTunNORM', text: 'x' }, { text: 'y' }])).toBe('iTunNORM: x, y');
    expect(tagValueToString(new Uint8Array(5))).toBe('<5 bytes>');
    expect(tagValueToString({ format: 'image/png', type: 'Cover (front)', data: new Uint8Array(3) })).toBe(
      'image/png · Cover (front) · <3 bytes>',
    );
    expect(tagValueToString({ a: new Uint8Array(2) })).toBe('{"a":"<2 bytes>"}');
  });

  it('exports JSON without the binary data', async () => {
    const json = JSON.parse(metadataToJson(await parse(MP3, 'audio/mpeg'))) as { common: { title: string } };
    expect(json.common.title).toBe('Galway');
  });
});
