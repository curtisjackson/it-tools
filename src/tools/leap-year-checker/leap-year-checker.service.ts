// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/time/check-leap-years/service.ts, with year ranges and a
// structured result so the tool can translate it.

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export type LeapYearLine = { kind: 'year'; year: number; leap: boolean } | { kind: 'invalid'; text: string };

const MAX_RANGE = 10_000;

/** Reads one year per line, or a range such as `2020-2030` (expanded), skipping empty lines. */
export function checkLeapYears(input: string): LeapYearLine[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap<LeapYearLine>((line) => {
      const range = line.match(/^(\d{1,4})\s*[-–—]\s*(\d{1,4})$/);
      if (range) {
        const [from, to] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
        if (to - from > MAX_RANGE) {
          return [{ kind: 'invalid', text: line }];
        }
        return Array.from({ length: to - from + 1 }, (_, i) => ({
          kind: 'year',
          year: from + i,
          leap: isLeapYear(from + i),
        }));
      }
      if (!/^\d{1,4}$/.test(line)) {
        return [{ kind: 'invalid', text: line }];
      }
      const year = Number(line);
      return [{ kind: 'year', year, leap: isLeapYear(year) }];
    });
}
