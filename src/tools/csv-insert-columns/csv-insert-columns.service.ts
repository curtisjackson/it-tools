// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/insert-csv-columns/service.ts and types.ts. Cells that
// contain the separator are quoted in the output.
import { joinCsvLine, splitCsv } from '@/utils/csv';
import { normalizeAndFill, transpose } from '@/utils/matrix';

export type insertingPosition = 'prepend' | 'append' | 'custom';
export type customPostion = 'headerName' | 'rowNumber';

export interface InitialValuesType {
  csvToInsert: string;
  separator: string;
  quoteChar: string;
  commentCharacter: string;
  customFill: boolean;
  customFillValue: string;
  insertingPosition: insertingPosition;
  customPostionOptions: customPostion;
  headerName: string;
  /** Number of columns before the inserted ones. */
  rowNumber: number;
}

function parse(csv: string, options: InitialValuesType): string[][] {
  const rows = splitCsv(csv, {
    delimiter: options.separator,
    quoteChar: options.quoteChar,
    commentCharacter: options.commentCharacter,
    deleteComment: true,
    deleteEmptyLines: true,
  });
  return normalizeAndFill(rows, options.customFill ? options.customFillValue : '');
}

/** Inserts the columns of `csvToInsert` at the start, at the end, after a header or after N columns. */
export function main(input: string, options: InitialValuesType): string {
  if (!input || !options.csvToInsert) {
    return '';
  }
  const rows = parse(input, options);
  let columns = transpose(rows).map((column) => column.map((cell) => cell ?? ''));
  const inserted = transpose(parse(options.csvToInsert, options)).map((column) => column.map((cell) => cell ?? ''));

  let index = -1;
  if (options.insertingPosition === 'prepend') {
    index = 0;
  } else if (options.insertingPosition === 'append') {
    index = columns.length;
  } else if (options.customPostionOptions === 'headerName') {
    const header = rows[0]?.indexOf(options.headerName) ?? -1;
    index = header === -1 ? -1 : header + 1;
  } else if (options.rowNumber >= 0 && options.rowNumber <= columns.length) {
    index = options.rowNumber;
  }
  if (index !== -1) {
    columns = [...columns.slice(0, index), ...inserted, ...columns.slice(index)];
  }

  return transpose(normalizeAndFill(columns, options.customFillValue))
    .map((row) =>
      joinCsvLine(
        row.map((cell) => cell ?? ''),
        options.separator,
        options.quoteChar,
      ),
    )
    .join('\n');
}
