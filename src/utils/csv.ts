// Ported from omni-tools (MIT) v0.7.0: src/utils/csv.ts

export interface CsvOptions {
  delimiter: string;
  quoteChar: string;
  commentCharacter: string;
  deleteComment: boolean;
  deleteEmptyLines: boolean;
}

export const defaultCsvOptions: CsvOptions = {
  delimiter: ',',
  quoteChar: '"',
  commentCharacter: '#',
  deleteComment: true,
  deleteEmptyLines: true,
};

/** Splits one CSV line into trimmed cells. A doubled quote inside a quoted cell stands for one quote character. */
export function splitCsvLine(line: string, delimiter = ',', quoteChar = '"'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (quoteChar && char === quoteChar) {
      if (inQuotes && line[i + 1] === quoteChar) {
        current += quoteChar;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/** Splits CSV text into rows of cells. Quoted cells cannot span several lines. */
export function splitCsv(
  input: string,
  { delimiter, quoteChar, commentCharacter, deleteComment, deleteEmptyLines }: CsvOptions = defaultCsvOptions,
): string[][] {
  let rows = input.split(/\r?\n/).map((line) => splitCsvLine(line, delimiter, quoteChar));

  if (deleteComment && commentCharacter) {
    rows = rows.filter((row) => !row[0].startsWith(commentCharacter));
  }
  if (deleteEmptyLines) {
    rows = rows.filter((row) => row.some((cell) => cell !== ''));
  }
  return rows;
}

/** Returns the cells of the first line that is neither empty nor a comment, without a leading BOM. */
export function getCsvHeaders(input: string, delimiter = ',', quoteChar = '"', commentCharacter?: string): string[] {
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || (commentCharacter && trimmed.startsWith(commentCharacter))) {
      continue;
    }
    return splitCsvLine(trimmed.replace(/^﻿/, ''), delimiter, quoteChar);
  }
  return [];
}

/**
 * Joins cells into one CSV line. A cell is quoted when `quoteAll` is set or when it contains the delimiter, the quote
 * character or a line break; quote characters inside it are doubled.
 */
export function joinCsvLine(cells: string[], delimiter = ',', quoteChar = '"', quoteAll = false): string {
  return cells
    .map((cell) => {
      const needsQuotes =
        quoteAll || cell.includes(delimiter) || (quoteChar !== '' && cell.includes(quoteChar)) || /[\r\n]/.test(cell);
      if (!needsQuotes || quoteChar === '') {
        return cell;
      }
      return `${quoteChar}${cell.split(quoteChar).join(quoteChar + quoteChar)}${quoteChar}`;
    })
    .join(delimiter);
}

export function joinCsv(rows: string[][], delimiter = ',', quoteChar = '"', quoteAll = false): string {
  return rows.map((row) => joinCsvLine(row, delimiter, quoteChar, quoteAll)).join('\n');
}
