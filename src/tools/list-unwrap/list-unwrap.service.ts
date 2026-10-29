// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/unwrap/service.ts
import { type SplitOperatorType, joinWith, splitBy } from '@/utils/text-split';

export type { SplitOperatorType };

function unwrapStart(item: string, left: string, multiLevel: boolean): string {
  let result = item;
  while (left !== '' && result.startsWith(left)) {
    result = result.slice(left.length);
    if (!multiLevel) {
      break;
    }
  }
  return result;
}

function unwrapEnd(item: string, right: string, multiLevel: boolean): string {
  let result = item;
  while (right !== '' && result.endsWith(right)) {
    result = result.slice(0, result.length - right.length);
    if (!multiLevel) {
      break;
    }
  }
  return result;
}

/** Removes `left` and `right` from the ends of each item, once or as many times as they repeat. */
export function unwrapList(
  splitOperatorType: SplitOperatorType,
  input: string,
  splitSeparator: string,
  joinSeparator: string,
  deleteEmptyItems: boolean,
  multiLevel: boolean,
  trimItems: boolean,
  left = '',
  right = '',
): string {
  let items = splitBy(input, { splitOperatorType, splitSeparator });
  if (deleteEmptyItems) {
    items = items.filter(Boolean);
  }
  let unwrapped = items.map((item) => unwrapEnd(unwrapStart(item, left, multiLevel), right, multiLevel));
  if (trimItems) {
    unwrapped = unwrapped.map((item) => item.trim());
  }
  return joinWith(unwrapped, joinSeparator);
}
