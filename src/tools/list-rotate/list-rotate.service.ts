// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/list/rotate/service.ts
import { type SplitOperatorType, joinWith, splitBy } from '@/utils/text-split';

export type { SplitOperatorType };

function rotateArray(array: string[], step: number, right: boolean): string[] {
  const offset = (((right ? -step : step) % array.length) + array.length) % array.length || 0;
  return [...array.slice(offset), ...array.slice(0, offset)];
}

/** Moves the items circularly by `step` positions to the right or to the left. */
export function rotateList(
  splitOperatorType: SplitOperatorType,
  input: string,
  splitSeparator: string,
  joinSeparator: string,
  right: boolean,
  step?: number,
): string {
  const items = splitBy(input, { splitOperatorType, splitSeparator });
  if (step === undefined || Number.isNaN(step)) {
    throw new Error('Rotation step contains non-digits.');
  }
  if (step <= 0) {
    throw new Error('Rotation step must be greater than zero.');
  }
  return joinWith(rotateArray(items, step, right), joinSeparator);
}
