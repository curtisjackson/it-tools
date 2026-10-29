// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/number/arithmetic-sequence/service.ts, computed with decimal.js
// so that steps such as 0.1 do not accumulate floating-point errors.
import Decimal from 'decimal.js';
import { unescapeSeparator } from '@/utils/text-split';

/** The first `numberOfTerms` terms of `firstTerm + n × commonDifference`, joined by `separator`. */
export function generateArithmeticSequence(
  firstTerm: number,
  commonDifference: number,
  numberOfTerms: number,
  separator: string,
): string {
  const count = Math.max(0, Math.floor(numberOfTerms));
  const first = new Decimal(firstTerm);
  const step = new Decimal(commonDifference);
  return Array.from({ length: count }, (_, i) => first.plus(step.times(i)).toString()).join(
    unescapeSeparator(separator),
  );
}

/** Sum of the first `numberOfTerms` terms: n × (2a + (n − 1)d) / 2. */
export function arithmeticSeriesSum(firstTerm: number, commonDifference: number, numberOfTerms: number): string {
  const n = new Decimal(Math.max(0, Math.floor(numberOfTerms)));
  return n
    .times(new Decimal(firstTerm).times(2).plus(n.minus(1).times(commonDifference)))
    .dividedBy(2)
    .toString();
}
