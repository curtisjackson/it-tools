// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/ExtractDates.mjs and search() from
// src/core/lib/Extract.mjs. Extended: impossible dates such as 31.02 are dropped, ISO dates may carry a time, the order
// of day and month is chosen, and dates can be normalised to ISO.

export type DayMonthOrder = 'dmy' | 'mdy';

export interface ExtractedDate {
  /** The date as written in the text. */
  text: string;
  /** `YYYY-MM-DD`, followed by the time as written for ISO date-times. */
  iso: string;
}

const SEPARATOR = '[-/. ]';
const YEAR = '(?:1\\d|2\\d)\\d\\d';
const TIME = '(?:[T ](?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|[+-](?:[01]\\d|2[0-3]):?[0-5]\\d)?)?';

function buildRegex(order: DayMonthOrder): RegExp {
  const ymd = `(?<y1>${YEAR})(?<s1>${SEPARATOR})(?<m1>0?[1-9]|1[0-2])\\k<s1>(?<d1>0?[1-9]|[12]\\d|3[01])(?<time>${TIME})`;
  const dmy = `(?<d2>0?[1-9]|[12]\\d|3[01])(?<s2>${SEPARATOR})(?<m2>0?[1-9]|1[0-2])\\k<s2>(?<y2>${YEAR})`;
  const mdy = `(?<m2>0?[1-9]|1[0-2])(?<s2>${SEPARATOR})(?<d2>0?[1-9]|[12]\\d|3[01])\\k<s2>(?<y2>${YEAR})`;
  return new RegExp(`(?<![\\d.\\-/])(?:${ymd}|${order === 'dmy' ? dmy : mdy})(?!\\d|[.\\-/]\\d)`, 'g');
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Finds the dates in the text, in order of appearance. */
export function extractDates(input: string, { order = 'dmy' as DayMonthOrder, unique = false } = {}): ExtractedDate[] {
  const results: ExtractedDate[] = [];
  for (const match of input.matchAll(buildRegex(order))) {
    const groups = match.groups!;
    const year = Number(groups.y1 ?? groups.y2);
    const month = Number(groups.m1 ?? groups.m2);
    const day = Number(groups.d1 ?? groups.d2);
    if (day > daysInMonth(year, month)) {
      continue;
    }
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    results.push({ text: match[0], iso: groups.time ? `${date}${groups.time.replace(' ', 'T')}` : date });
  }
  if (!unique) {
    return results;
  }
  const seen = new Set<string>();
  return results.filter(({ iso }) => !seen.has(iso) && seen.add(iso));
}
