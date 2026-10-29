// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/transpose-csv/service.ts and
// src/pages/tools/csv/csv-rows-to-columns/service.ts. Cells that contain the separator are quoted in the output.
import { joinCsvLine, splitCsv } from '@/utils/csv';
import { normalizeAndFill, transpose } from '@/utils/matrix';

export interface InitialValuesType {
  separator: string;
  commentCharacter: string;
  customFill: boolean;
  customFillValue: string;
  quoteChar: string;
}

/** Turns rows into columns; short rows are padded with `customFillValue` (or nothing). */
export function transposeCSV(input: string, options: InitialValuesType): string {
  if (!input) {
    return '';
  }
  const rows = splitCsv(input, {
    delimiter: options.separator,
    quoteChar: options.quoteChar,
    commentCharacter: options.commentCharacter,
    deleteComment: true,
    deleteEmptyLines: true,
  });
  const filled = normalizeAndFill(rows, options.customFill ? options.customFillValue : '');
  return transpose(filled)
    .map((row) =>
      joinCsvLine(
        row.map((cell) => cell ?? ''),
        options.separator,
        options.quoteChar,
      ),
    )
    .join('\n');
}

/** omni-tools' "CSV rows to columns": comma-separated, without trimming, missing cells filled with `customFiller`. */
export function csvRowsToColumns(
  input: string,
  emptyValuesFilling: boolean,
  customFiller: string,
  commentCharacter: string,
): string {
  if (!input) {
    return '';
  }
  const rows = input
    .split('\n')
    .map((row) => row.split(','))
    .filter((row) => !(row.length === 1 && row[0].trim() === '') && !row[0].trim().startsWith(commentCharacter));
  const filled = rows.map((row) => row.map((cell) => cell || (emptyValuesFilling ? '' : customFiller)));
  return transpose(normalizeAndFill(filled, emptyValuesFilling ? '' : customFiller)).join('\n');
}
