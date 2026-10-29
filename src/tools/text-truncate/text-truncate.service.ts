// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/truncate/service.ts and
// src/pages/tools/string/extract-substring/service.ts
import { reverseString } from '@/utils/text-items';

export type truncationSideType = 'right' | 'left';

export interface InitialValuesType {
  truncationSide: truncationSideType;
  maxLength: string;
  lineByLine: boolean;
  addIndicator: boolean;
  indicator: string;
}

export const initialValues: InitialValuesType = {
  truncationSide: 'right',
  maxLength: '15',
  lineByLine: false,
  addIndicator: false,
  indicator: '',
};

/** Keeps at most `maxLength` characters, from the start (`right`) or the end (`left`), indicator included. */
export function truncateText(options: InitialValuesType, text: string): string {
  const { truncationSide, maxLength, lineByLine, addIndicator, indicator } = options;
  const parsedMaxLength = Number.parseInt(maxLength) || 0;
  if (parsedMaxLength < 0) {
    throw new Error('Length value cannot be negative');
  }
  const truncate = (line: string) => {
    const kept =
      truncationSide === 'right'
        ? line.slice(0, parsedMaxLength)
        : parsedMaxLength === 0
          ? ''
          : line.slice(-parsedMaxLength);
    return addIndicator ? addIndicatorToText(kept, indicator, truncationSide) : kept;
  };
  return lineByLine ? text.split('\n').map(truncate).join('\n') : truncate(text);
}

function addIndicatorToText(text: string, indicator: string, truncationSide: truncationSideType): string {
  if (indicator.length > text.length && text.length) {
    throw new Error('Indicator length is greater than truncation length');
  }
  if (!text.length) {
    return '';
  }
  return truncationSide === 'right'
    ? `${text.slice(0, text.length - indicator.length)}${indicator}`
    : `${indicator}${text.slice(-text.length + indicator.length)}`;
}

/** Takes `length` characters starting at the 1-based position `start`, optionally per line and reversed. */
export function extractSubstring(
  input: string,
  start: number,
  length: number,
  multiLine: boolean,
  reverse: boolean,
): string {
  if (!input) {
    return '';
  }
  if (start <= 0) {
    throw new Error('Start index must be greater than zero.');
  }
  if (length < 0) {
    throw new Error('Length value must be greater than or equal to zero.');
  }
  if (length === 0) {
    return '';
  }
  const extract = (line: string) =>
    start - 1 >= line.length ? '' : line.substring(start - 1, Math.min(start - 1 + length, line.length));
  const result = (multiLine ? input.split('\n') : [input]).map(extract);
  return (reverse ? result.map(reverseString) : result).join('\n');
}
