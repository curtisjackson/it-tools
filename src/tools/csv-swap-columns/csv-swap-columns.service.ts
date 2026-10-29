// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/swap-csv-columns/service.ts and types.ts. Adds the separator
// and quote options (omni-tools always split and joined on commas).
import { joinCsvLine, splitCsv } from '@/utils/csv';

export interface InitialValuesType {
  fromPositionStatus: boolean;
  fromPosition: string;
  toPositionStatus: boolean;
  toPosition: string;
  fromHeader: string;
  toHeader: string;
  emptyValuesFilling: boolean;
  customFiller: string;
  deleteComment: boolean;
  commentCharacter: string;
  emptyLines: boolean;
  separator?: string;
  quoteChar?: string;
}

function retrieveFromAndTo(headerRow: string[], options: InitialValuesType): [number, number] {
  const from = options.fromPositionStatus
    ? Number(options.fromPosition)
    : headerRow.findIndex((header) => header === options.fromHeader) + 1;
  const to = options.toPositionStatus
    ? Number(options.toPosition)
    : headerRow.findIndex((header) => header === options.toHeader) + 1;
  if (!(from > 0) || !(to > 0)) {
    throw new Error('Invalid column positions. Check headers or positions.');
  }
  if (from > headerRow.length || to > headerRow.length) {
    throw new Error(`There are only ${headerRow.length} columns`);
  }
  return [from, to];
}

/** Swaps two columns, chosen by 1-based position or by header name. */
export function csvColumnsSwap(input: string, options: InitialValuesType): string {
  if (!input) {
    return '';
  }
  const separator = options.separator ?? ',';
  const quoteChar = options.quoteChar ?? '"';
  const rows = splitCsv(input, {
    delimiter: separator,
    quoteChar,
    commentCharacter: options.commentCharacter,
    deleteComment: options.deleteComment,
    deleteEmptyLines: options.emptyLines,
  });
  const columnCount = Math.max(...rows.map((row) => row.length));
  const filled = rows.map((row) =>
    Array.from({ length: columnCount }, (_, j) => row[j] || (options.emptyValuesFilling ? '' : options.customFiller)),
  );
  const [from, to] = retrieveFromAndTo(filled[0], options);
  return filled
    .map((row) => {
      const swapped = [...row];
      [swapped[from - 1], swapped[to - 1]] = [swapped[to - 1], swapped[from - 1]];
      return joinCsvLine(swapped, separator, quoteChar);
    })
    .join('\n');
}
