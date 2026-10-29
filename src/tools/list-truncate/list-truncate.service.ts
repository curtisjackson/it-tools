// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/truncate/service.ts
import { type SplitOperatorType, joinWith, splitBy } from '@/utils/text-split';

export type { SplitOperatorType };

/** Keeps `length` items: the first ones when `end` is set (the end is cut off), otherwise the last ones. */
export function truncateList(
  splitOperatorType: SplitOperatorType,
  input: string,
  splitSeparator: string,
  joinSeparator: string,
  end: boolean,
  length?: number,
): string {
  const items = splitBy(input, { splitOperatorType, splitSeparator });
  if (length === undefined || Number.isNaN(length)) {
    throw new Error("Length value isn't a value number.");
  }
  if (length < 0) {
    throw new Error('Length value must be a positive number.');
  }
  return joinWith(end ? items.slice(0, length) : items.slice(Math.max(0, items.length - length)), joinSeparator);
}
