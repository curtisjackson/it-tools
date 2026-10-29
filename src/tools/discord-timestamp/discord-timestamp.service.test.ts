import { describe, expect, it } from 'vitest';
import { compute, previewDiscordTimestamp } from './discord-timestamp.service';

const date = new Date('2021-04-20T16:20:30Z');

describe('discord-timestamp', () => {
  it('builds the timestamp markup', () => {
    expect(compute(date)).toBe('<t:1618935630:F>');
    expect(compute(date, 'R')).toBe('<t:1618935630:R>');
    expect(compute(new Date(1618935630999), 't')).toBe('<t:1618935630:t>');
  });

  it('previews the absolute formats', () => {
    expect(previewDiscordTimestamp(date, 't', 'en-GB', date, 'UTC')).toBe('16:20');
    expect(previewDiscordTimestamp(date, 'T', 'en-GB', date, 'UTC')).toBe('16:20:30');
    expect(previewDiscordTimestamp(date, 'd', 'en-GB', date, 'UTC')).toBe('20/04/2021');
    expect(previewDiscordTimestamp(date, 'D', 'en-GB', date, 'UTC')).toBe('20 April 2021');
    expect(previewDiscordTimestamp(date, 'F', 'en-GB', date, 'UTC')).toContain('Tuesday');
  });

  it('previews the relative format', () => {
    const now = new Date('2021-06-20T16:20:30Z');
    expect(previewDiscordTimestamp(date, 'R', 'en', now)).toBe('2 months ago');
    expect(previewDiscordTimestamp(now, 'R', 'en', date)).toBe('in 2 months');
    expect(previewDiscordTimestamp(date, 'R', 'ru', new Date('2021-04-20T16:20:35Z'))).toBe('5 секунд назад');
    expect(previewDiscordTimestamp(date, 'R', 'en', date)).toBe('now');
  });
});
