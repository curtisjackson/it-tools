// Ported from omni-tools (MIT) v0.7.0: src/utils/string.ts

/** Visual representations of the whitespace characters, used when such a character is shown as a list item. */
export const specialCharMap: Record<string, string> = {
  '': '␀',
  ' ': '␣',
  '\n': '↲',
  '\t': '⇥',
  '\r': '␍',
  '\f': '␌',
  '\v': '␋',
};

/** Reverses a string by code point, so characters outside the BMP (emoji, ...) stay intact. */
export function reverseString(input: string): string {
  return Array.from(input).reverse().join('');
}

/** Whether the input is an unsigned integer or decimal number such as `12` or `3.5`. */
export function containsOnlyDigits(input: string): boolean {
  return /^\d+(\.\d+)?$/.test(input.trim());
}

/** Removes the surrounding quote characters of a value, if it is quoted. */
export function unquoteIfQuoted(value: string, quoteCharacter: string): string {
  if (quoteCharacter && value.length >= 2 && value.startsWith(quoteCharacter) && value.endsWith(quoteCharacter)) {
    return value.slice(1, -1);
  }
  return value;
}

/** Counts how many times each item occurs; whitespace items are keyed by their visual representation. */
export function itemCounter(items: string[], ignoreItemCase: boolean): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    let key = ignoreItemCase ? item.toLowerCase() : item;
    if (key in specialCharMap) {
      key = specialCharMap[key];
    }
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
