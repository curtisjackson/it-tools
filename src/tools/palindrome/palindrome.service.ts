// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/palindrome/service.ts and
// src/pages/tools/string/create-palindrome/service.ts, plus a "letters and digits only" check.
import { type SplitOperatorType, splitBy, unescapeSeparator } from '@/utils/text-split';
import { reverseString } from '@/utils/text-items';

export type { SplitOperatorType };

/** Whether the word reads the same both ways; `lettersOnly` ignores case, spaces and punctuation. */
export function isPalindrome(word: string, lettersOnly = false): boolean {
  const chars = Array.from(lettersOnly ? word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') : word);
  return chars.every((char, i) => char === chars[chars.length - 1 - i]);
}

/**
 * Checks each item (trimmed) and returns `true`/`false` for each, joined by the same separator (a typed `\n` is
 * unescaped). With a regex separator the results go one per line: joining with the pattern itself, as omni-tools does,
 * would print `true\s+false`.
 */
export function palindromeList(
  splitOperatorType: SplitOperatorType,
  input: string,
  separator: string,
  lettersOnly = false,
): string {
  if (!input) {
    return '';
  }
  return splitBy(input, { splitOperatorType, splitSeparator: separator })
    .map((item) => String(isPalindrome(item.trim(), lettersOnly)))
    .join(splitOperatorType === 'symbol' ? unescapeSeparator(separator) : '\n');
}

/** One line per item: `✅ level` or `❌ hello`. */
export function palindromeReport(
  splitOperatorType: SplitOperatorType,
  input: string,
  separator: string,
  lettersOnly = false,
): string {
  if (!input) {
    return '';
  }
  return splitBy(input, { splitOperatorType, splitSeparator: separator })
    .map((item) => item.trim())
    .map((item) => `${isPalindrome(item, lettersOnly) ? '✅' : '❌'} ${item}`)
    .join('\n');
}

/** Appends the reversed text; without `lastChar` the last character is not repeated (`hello` → `hellolleh`). */
export function createPalindrome(input: string, lastChar: boolean): string {
  if (!input) {
    return '';
  }
  const chars = Array.from(input);
  return input + reverseString((lastChar ? chars : chars.slice(0, -1)).join(''));
}

export function createPalindromeList(input: string, lastChar: boolean, multiLine: boolean): string {
  if (!input) {
    return '';
  }
  return multiLine
    ? input
        .split('\n')
        .map((line) => createPalindrome(line, lastChar))
        .join('\n')
    : createPalindrome(input, lastChar);
}
