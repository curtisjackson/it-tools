// Replaces CyberChef's Extract ID3 and Extract Audio Metadata operations (src/core/operations/ExtractID3.mjs,
// ExtractAudioMetadata.mjs) with `music-metadata`, which also reads the tags of MP4/M4A and AIFF files (CyberChef only
// listed their atoms) and the duration, bitrate and codec. This file turns its result into rows to display.
import type { IAudioMetadata, ICommonTagsResult, IFormat, IPicture } from 'music-metadata';

export type Row = [key: string, value: string];

export const formatKeys = [
  'container',
  'codec',
  'codecProfile',
  'tool',
  'duration',
  'bitrate',
  'sampleRate',
  'bitsPerSample',
  'numberOfChannels',
  'lossless',
  'tagTypes',
] as const;

export const commonKeys = [
  'title',
  'artist',
  'albumartist',
  'album',
  'year',
  'date',
  'track',
  'disk',
  'genre',
  'composer',
  'comment',
  'lyrics',
  'bpm',
  'key',
  'isrc',
  'label',
  'copyright',
  'encodedby',
  'encodersettings',
  'language',
] as const;

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds * 1000);
  const [h, m, s, ms] = [
    Math.floor(total / 3_600_000),
    Math.floor(total / 60_000) % 60,
    Math.floor(total / 1000) % 60,
    total % 1000,
  ];
  const clock = `${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  return h ? `${h}:${clock}` : clock;
}

/** Writes any tag value as text; binary data is summarised by its size. */
export function tagValueToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Uint8Array) {
    return `<${value.length} bytes>`;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(tagValueToString).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('no' in record && 'of' in record) {
      const { no, of } = record as { no: number | null; of: number | null };
      return no === null ? '' : of ? `${no}/${of}` : String(no);
    }
    if (typeof record.text === 'string') {
      return typeof record.descriptor === 'string' && record.descriptor
        ? `${record.descriptor}: ${record.text}`
        : record.text;
    }
    if (record.data instanceof Uint8Array) {
      return [record.format, record.type, record.description]
        .filter((part): part is string => typeof part === 'string' && part !== '')
        .concat(`<${record.data.length} bytes>`)
        .join(' · ');
    }
    return JSON.stringify(value, (_, inner: unknown) =>
      inner instanceof Uint8Array ? `<${inner.length} bytes>` : inner,
    );
  }
  return String(value as string | number | boolean | bigint);
}

export function formatRows(format: IFormat): Row[] {
  const rows: Row[] = [];
  for (const key of formatKeys) {
    const value = format[key];
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      continue;
    }
    switch (key) {
      case 'duration':
        rows.push([key, formatDuration(value as number)]);
        break;
      case 'bitrate':
        rows.push([key, `${Math.round((value as number) / 1000)} kbit/s`]);
        break;
      case 'sampleRate':
        rows.push([key, `${value as number} Hz`]);
        break;
      default:
        rows.push([key, tagValueToString(value)]);
    }
  }
  return rows;
}

export function commonRows(common: ICommonTagsResult): Row[] {
  return commonKeys.map((key): Row => [key, tagValueToString(common[key])]).filter(([, value]) => value !== '');
}

export function nativeRows(metadata: IAudioMetadata): { type: string; rows: Row[] }[] {
  return Object.entries(metadata.native)
    .filter(([, tags]) => tags.length > 0)
    .map(([type, tags]) => ({ type, rows: tags.map(({ id, value }): Row => [id, tagValueToString(value)]) }));
}

export function pictures(metadata: IAudioMetadata): IPicture[] {
  return metadata.common.picture ?? [];
}

/** Everything as JSON, with binary data replaced by its size. */
export function metadataToJson(metadata: IAudioMetadata): string {
  const { format, common, native, quality } = metadata;
  return JSON.stringify(
    { format, common, native, warnings: quality.warnings.map(({ message }) => message) },
    (_, value: unknown) => (value instanceof Uint8Array ? `<${value.length} bytes>` : value),
    2,
  );
}
