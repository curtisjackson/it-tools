// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/shuffle/service.ts
import { type SplitOperatorType, joinWith, splitBy } from '@/utils/text-split';

export type { SplitOperatorType };

/** Fisher–Yates shuffle of a copy; `random` is injectable for tests. */
export function shuffleArray<T>(array: T[], random: () => number = Math.random): T[] {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Shuffles the items, optionally keeping only the first `length` of them. */
export function shuffleList(
  splitOperatorType: SplitOperatorType,
  input: string,
  splitSeparator: string,
  joinSeparator: string,
  length?: number,
  random: () => number = Math.random,
): string {
  const shuffled = shuffleArray(splitBy(input, { splitOperatorType, splitSeparator }), random);
  if (length !== undefined) {
    if (length <= 0) {
      throw new Error('Length value must be a positive number.');
    }
    return joinWith(shuffled.slice(0, length), joinSeparator);
  }
  return joinWith(shuffled, joinSeparator);
}
