// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/repeat/service.ts
import { unescapeSeparator } from '@/utils/text-split';

/** Repeats the text `count` times, joined by `delimiter` (`\n`, `\t`... are unescaped). */
export function repeatText(text: string, count: number, delimiter: string): string {
  if (!Number.isInteger(count) || count <= 0) {
    return '';
  }
  return Array.from({ length: count }, () => text).join(unescapeSeparator(delimiter));
}
