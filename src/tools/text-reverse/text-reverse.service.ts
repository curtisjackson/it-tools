// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/reverse/service.ts
import { reverseString } from '@/utils/text-items';

export interface ReverseOptions {
  multiLine: boolean;
  skipEmptyLines: boolean;
  trim: boolean;
}

/** Reverses the text character by character, or each line separately in multi-line mode. */
export function reverseText(input: string, { multiLine, skipEmptyLines, trim }: ReverseOptions): string {
  let lines = multiLine ? input.split('\n') : [input];
  if (skipEmptyLines) {
    lines = lines.filter(Boolean);
  }
  if (trim) {
    lines = lines.map((line) => line.trim());
  }
  return lines.map(reverseString).join('\n');
}
