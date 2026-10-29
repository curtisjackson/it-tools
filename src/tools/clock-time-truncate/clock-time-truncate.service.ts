// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/time/truncate-clock-time/service.ts
import { containsOnlyDigits } from '@/utils/text-items';

function truncateLine(
  parts: string[],
  lineNumber: number,
  onlySeconds: boolean,
  zeroPrint: boolean,
  zeroPadding: boolean,
): string {
  if (parts[0] === '') {
    return '';
  }
  if (parts.length > 3) {
    throw new Error(`Time contains more than 3 parts on line ${lineNumber}`);
  }
  [...parts, '0', '0'].forEach((part, index) => {
    if (!containsOnlyDigits(part)) {
      throw new Error(`Time doesn't contain valid ${['hours', 'minutes', 'seconds'][index]} on line ${lineNumber}`);
    }
  });
  const kept = onlySeconds ? parts.slice(0, 2) : parts.slice(0, 1);
  if (zeroPrint) {
    kept.push(...(onlySeconds ? ['0'] : ['0', '0']));
  }
  return (zeroPadding ? kept.map((unit) => unit.padStart(2, '0')) : kept).join(':');
}

/** Drops the seconds (or the minutes and seconds) of each `HH:MM:SS` line, optionally printing them as zeros. */
export function truncateClockTime(
  input: string,
  onlySeconds: boolean,
  zeroPrint: boolean,
  zeroPadding: boolean,
): string {
  return input
    .split('\n')
    .map((line, index) => truncateLine(line.split(':'), index + 1, onlySeconds, zeroPrint, zeroPadding))
    .join('\n');
}
