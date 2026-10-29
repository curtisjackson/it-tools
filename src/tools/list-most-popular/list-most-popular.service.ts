// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/find-most-popular/service.ts
import { type SplitOperatorType, splitBy } from '@/utils/text-split';
import { itemCounter } from '@/utils/text-items';

export type { SplitOperatorType };
export type DisplayFormat = 'count' | 'percentage' | 'total';
export type SortingMethod = 'count' | 'alphabetic';

function sortEntries(counts: Record<string, number>, sortingMethod: SortingMethod): [string, number][] {
  const entries = Object.entries(counts);
  return sortingMethod === 'count'
    ? entries.sort(([, countA], [, countB]) => countB - countA)
    : entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
}

function formatEntries(entries: [string, number][], displayFormat: DisplayFormat): string[] {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return entries.map(([key, count]) => {
    if (displayFormat === 'percentage') {
      return `${key}: ${count} (${((count / total) * 100).toFixed(2)}%)`;
    }
    if (displayFormat === 'total') {
      return `${key}: ${count} (${count} / ${total})`;
    }
    return `${key}: ${count}`;
  });
}

/** Counts how often each item occurs, one `item: count` line per distinct item. */
export function TopItemsList(
  splitOperatorType: SplitOperatorType,
  sortingMethod: SortingMethod,
  displayFormat: DisplayFormat,
  splitSeparator: string,
  input: string | string[],
  deleteEmptyItems: boolean,
  ignoreItemCase: boolean,
  trimItems: boolean,
): string {
  if (!input) {
    return '';
  }
  let items =
    typeof input === 'string'
      ? splitBy(input, { splitOperatorType, splitSeparator }).filter(
          (item) => splitOperatorType !== 'regex' || item !== '',
        )
      : input;
  if (trimItems) {
    items = items.map((item) => item.trim());
  }
  if (deleteEmptyItems) {
    items = items.filter((item) => item !== '');
  }
  return formatEntries(sortEntries(itemCounter(items, ignoreItemCase), sortingMethod), displayFormat).join('\n');
}
