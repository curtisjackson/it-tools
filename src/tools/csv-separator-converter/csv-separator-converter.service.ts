// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/change-csv-separator/service.ts. Without "quote all", cells
// that contain the new separator, a quote or a line break are still quoted, so the output stays valid CSV.
import { joinCsvLine, splitCsv } from '@/utils/csv';
import { unescapeSeparator } from '@/utils/text-split';

export interface InitialValuesType {
  inputSeparator: string;
  inputQuoteCharacter: string;
  commentCharacter: string;
  /** Remove empty lines. */
  emptyLines: boolean;
  outputSeparator: string;
  outputQuoteAll: boolean;
  OutputQuoteCharacter: string;
}

export function changeCsvSeparator(input: string, options: InitialValuesType): string {
  if (!input) {
    return '';
  }
  const rows = splitCsv(input, {
    delimiter: unescapeSeparator(options.inputSeparator),
    quoteChar: options.inputQuoteCharacter,
    commentCharacter: options.commentCharacter,
    deleteComment: true,
    deleteEmptyLines: options.emptyLines,
  });
  const separator = unescapeSeparator(options.outputSeparator);
  return rows
    .map((row) => joinCsvLine(row, separator, options.OutputQuoteCharacter, options.outputQuoteAll))
    .join('\n');
}
