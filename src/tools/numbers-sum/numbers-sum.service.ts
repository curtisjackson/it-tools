// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/number/sum/service.ts, summed with decimal.js so that
// 0.1 + 0.2 gives 0.3.
import Decimal from 'decimal.js';

export type NumberExtractionType = 'smart' | 'delimiter';

function getAllNumbers(text: string): string[] {
  return text.match(/-?\d+(?:\.\d+)?/g) ?? [];
}

function getDelimitedNumbers(text: string, separator: string): string[] {
  const normalizedSeparator = separator.replace(/\\n/g, '\n').trim();
  const pattern = normalizedSeparator
    ? new RegExp(`${normalizedSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`)
    : /\s+/;
  return text
    .split(pattern)
    .map((part) => part.trim())
    .filter((part) => part !== '' && !Number.isNaN(Number(part)));
}

/** Sums the numbers found in the text (`smart`) or between separators, or prints the running sum line by line. */
export function compute(
  input: string,
  extractionType: NumberExtractionType,
  printRunningSum: boolean,
  separator: string,
): string {
  const numbers = (extractionType === 'smart' ? getAllNumbers(input) : getDelimitedNumbers(input, separator)).map(
    (number) => new Decimal(number),
  );
  if (printRunningSum) {
    let sum = new Decimal(0);
    return numbers.map((number) => (sum = sum.plus(number)).toString()).join('\n') + (numbers.length ? '\n' : '');
  }
  return numbers.reduce((total, number) => total.plus(number), new Decimal(0)).toString();
}
