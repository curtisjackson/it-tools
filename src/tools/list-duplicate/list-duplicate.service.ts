// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/duplicate/service.ts
import { type SplitOperatorType, joinWith, splitBy } from '@/utils/text-split';

export type { SplitOperatorType };

function interweave(first: string[], second: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < Math.max(first.length, second.length); i++) {
    if (i < first.length) {
      result.push(first[i]);
    }
    if (i < second.length) {
      result.push(second[i]);
    }
  }
  return result;
}

/**
 * Repeats the list `copy` times (fractions repeat the start of the list). `concatenate` appends whole copies;
 * otherwise each item is followed by its copies. `reverse` makes the copies go backwards.
 */
function duplicate(input: string[], concatenate: boolean, reverse: boolean, copy?: number): string[] {
  if (!copy) {
    throw new Error('Number of copies must be a valid number');
  }
  if (copy < 0) {
    throw new Error('Number of copies cannot be negative');
  }
  const whole = Math.floor(copy);
  const fractional = copy - whole;
  if (!reverse) {
    const wholePart = (concatenate ? Array(whole) : Array(Math.max(0, whole - 1))).fill(input).flat();
    const fractionalPart = input.slice(0, Math.floor(input.length * fractional));
    const toAdd = wholePart.concat(fractionalPart);
    return concatenate ? toAdd : interweave(input, toAdd);
  }
  const wholePart = Array(Math.max(0, whole - 1))
    .fill(input)
    .flat()
    .reverse();
  const fractionalPart = input
    .slice()
    .reverse()
    .slice(0, Math.floor(input.length * fractional));
  const toAdd = wholePart.concat(fractionalPart);
  return concatenate ? input.concat(toAdd) : interweave(input, toAdd);
}

export function duplicateList(
  splitOperatorType: SplitOperatorType,
  splitSeparator: string,
  joinSeparator: string,
  input: string,
  concatenate: boolean,
  reverse: boolean,
  copy?: number,
): string {
  let items = splitBy(input, { splitOperatorType, splitSeparator });
  if (splitOperatorType === 'regex') {
    items = items.filter((item) => item !== '');
  }
  return joinWith(duplicate(items, concatenate, reverse, copy), joinSeparator);
}
