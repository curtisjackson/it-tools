// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/time/discord-timestamp/service.ts, plus a preview of how Discord
// renders each format.

export type DiscordTimestampFormat = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export const discordFormats: DiscordTimestampFormat[] = ['t', 'T', 'd', 'D', 'f', 'F', 'R'];

/** `<t:1700000000:F>` for a date. */
export function compute(date: Date, format: DiscordTimestampFormat = 'F'): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${format}>`;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** How Discord shows the timestamp, approximated with `Intl` for the given locale and time zone. */
export function previewDiscordTimestamp(
  date: Date,
  format: DiscordTimestampFormat,
  locale: string,
  now: Date = new Date(),
  timeZone?: string,
): string {
  const options: Record<Exclude<DiscordTimestampFormat, 'R'>, Intl.DateTimeFormatOptions> = {
    t: { timeStyle: 'short' },
    T: { timeStyle: 'medium' },
    d: { dateStyle: 'short' },
    D: { dateStyle: 'long' },
    f: { dateStyle: 'long', timeStyle: 'short' },
    F: { dateStyle: 'full', timeStyle: 'short' },
  };
  if (format !== 'R') {
    return new Intl.DateTimeFormat(locale, { ...options[format], timeZone }).format(date);
  }
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const [unit, size] = RELATIVE_UNITS.find(([, unitSeconds]) => Math.abs(seconds) >= unitSeconds) ?? ['second', 1];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
}
