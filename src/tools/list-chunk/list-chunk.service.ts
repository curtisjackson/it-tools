// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/group/service.ts
import { type SplitOperatorType, joinWith, splitBy } from '@/utils/text-split';

export type { SplitOperatorType };

/** Splits the list into chunks of `chunkNumber` items, each joined, wrapped, then joined by `chunkSeparator`. */
export function chunkList(
  splitOperatorType: SplitOperatorType,
  splitSeparator: string,
  input: string,
  chunkNumber: number,
  itemSeparator = '',
  leftWrap = '',
  rightWrap = '',
  chunkSeparator: string,
  deleteEmptyItems: boolean,
  padNonFullChunk: boolean,
  paddingChar = '',
): string {
  if (!splitSeparator || !(chunkNumber >= 1)) {
    return '';
  }
  let items = splitBy(input, { splitOperatorType, splitSeparator });
  if (deleteEmptyItems) {
    items = items.filter((item) => item !== '');
  }
  const chunks: string[][] = [];
  for (let i = 0; i < items.length; i += chunkNumber) {
    chunks.push(items.slice(i, i + chunkNumber));
  }
  const last = chunks.at(-1);
  if (padNonFullChunk && last) {
    while (last.length < chunkNumber) {
      last.push(paddingChar);
    }
  }
  return joinWith(
    chunks.map((chunk) => leftWrap + joinWith(chunk, itemSeparator) + rightWrap),
    chunkSeparator,
  );
}
