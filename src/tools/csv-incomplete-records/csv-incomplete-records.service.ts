// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/find-incomplete-csv-records/service.ts, returning structured
// issues (for translation) with the line numbers of the input: omni-tools counted lines after dropping comments.
import { splitCsvLine } from '@/utils/csv';

export interface InitialValuesType {
  csvSeparator: string;
  quoteCharacter: string;
  commentCharacter: string;
  /** Ignore empty lines instead of reporting them. */
  emptyLines: boolean;
  /** Report empty cells. */
  emptyValues: boolean;
}

export type CsvIssue =
  | { kind: 'empty-line'; line: number }
  | { kind: 'missing-columns'; line: number; missing: number }
  | { kind: 'empty-values'; line: number; columns: number[] };

/** Lists the incomplete records: empty lines, rows shorter than the longest row and empty cells. */
export function findIncompleteCsvRecords(input: string, options: InitialValuesType): CsvIssue[] {
  if (!input) {
    return [];
  }
  const records = input
    .split(/\r?\n/)
    .map((text, index) => ({ line: index + 1, text }))
    .filter(({ text }) => !options.commentCharacter || !text.trim().startsWith(options.commentCharacter))
    .filter(({ text }) => !options.emptyLines || text.trim() !== '')
    .map(({ line, text }) => ({ line, cells: splitCsvLine(text, options.csvSeparator, options.quoteCharacter) }));
  // A trailing line break is not a record.
  if (records.length > 0 && records.at(-1)!.cells.join('') === '' && input.endsWith('\n')) {
    records.pop();
  }
  const width = Math.max(0, ...records.map(({ cells }) => cells.length));

  return records.flatMap<CsvIssue>(({ line, cells }) => {
    if (cells.length === 1 && cells[0] === '') {
      return [{ kind: 'empty-line', line }];
    }
    if (cells.length < width) {
      return [{ kind: 'missing-columns', line, missing: width - cells.length }];
    }
    const empty = cells.flatMap((cell, index) => (cell === '' ? [index + 1] : []));
    return options.emptyValues && empty.length > 0 ? [{ kind: 'empty-values', line, columns: empty }] : [];
  });
}
