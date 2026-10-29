// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/tsv-to-json/service.ts, using the shared CSV line parser
// (doubled quotes) and keeping empty cells as empty strings with dynamic types.
import { splitCsvLine } from '@/utils/csv';
import { unescapeSeparator } from '@/utils/text-split';

export interface InitialValuesType {
  delimiter: string;
  quote: string;
  comment: string;
  useHeaders: boolean;
  skipEmptyLines: boolean;
  dynamicTypes: boolean;
  indentationType: 'tab' | 'space' | 'none';
  spacesCount: number;
}

export const initialValues: InitialValuesType = {
  delimiter: '\t',
  quote: '"',
  comment: '#',
  useHeaders: true,
  skipEmptyLines: true,
  dynamicTypes: true,
  indentationType: 'space',
  spacesCount: 2,
};

function parseValue(value: string | undefined, dynamicTypes: boolean): unknown {
  if (value === undefined) {
    return null;
  }
  if (!dynamicTypes || value === '') {
    return value;
  }
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }
  if (value === 'null') {
    return null;
  }
  return Number.isNaN(Number(value)) ? value : Number(value);
}

/** Converts tab-separated (or any delimiter) text to a JSON array of objects, or of arrays without headers. */
export function convertTsvToJson(input: string, options: InitialValuesType): string {
  if (!input) {
    return '';
  }
  const delimiter = unescapeSeparator(options.delimiter);
  const lines = input
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '' || !options.skipEmptyLines)
    .filter((line) => !options.comment || !line.trim().startsWith(options.comment))
    .filter((line) => !options.skipEmptyLines || line.split(delimiter).some((cell) => cell.trim() !== ''));
  if (lines.length === 0) {
    return '[]';
  }
  const rows = lines.map((line) => splitCsvLine(line, delimiter, options.quote));
  const result = options.useHeaders
    ? rows
        .slice(1)
        .map((values) =>
          Object.fromEntries(rows[0].map((header, i) => [header, parseValue(values[i], options.dynamicTypes)])),
        )
    : rows.map((values) => values.map((value) => parseValue(value, options.dynamicTypes)));
  const indent =
    options.indentationType === 'none'
      ? undefined
      : options.indentationType === 'tab'
        ? '\t'
        : ' '.repeat(options.spacesCount);
  return JSON.stringify(result, null, indent);
}
