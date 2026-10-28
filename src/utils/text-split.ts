// Ported from omni-tools (MIT) v0.7.0: the `splitOperatorType` switch repeated in src/pages/tools/list/*/service.ts
// and `replaceSpecialCharacters` from src/utils/string.ts.

export type SplitOperatorType = 'symbol' | 'regex';

export interface SplitOptions {
  splitOperatorType: SplitOperatorType;
  splitSeparator: string;
}

/**
 * Turns the escape sequences a user can type in a separator field (`\n`, `\t`, ...) into the characters they stand for.
 */
export function unescapeSeparator(separator: string): string {
  return separator
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\v/g, '\v');
}

export function splitBy(input: string, { splitOperatorType, splitSeparator }: SplitOptions): string[] {
  if (splitOperatorType === 'regex') {
    return input.split(new RegExp(splitSeparator));
  }
  return input.split(unescapeSeparator(splitSeparator));
}

export function joinWith(items: string[], joinSeparator: string): string {
  return items.join(unescapeSeparator(joinSeparator));
}
