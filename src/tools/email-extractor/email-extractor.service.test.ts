// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/email-extractor
import { describe, expect, it } from 'vitest';
import { extractEmails } from './email-extractor.service';

describe('extractEmails', () => {
  it('should extract single email from text', () => {
    const input = 'Contact us at hello@example.com';
    const result = extractEmails(input, false);
    expect(result).toBe('hello@example.com');
  });

  it('should extract multiple emails from text', () => {
    const input = 'Emails: a@b.com, c@d.org, e@f.net';
    const result = extractEmails(input, false);
    expect(result).toBe('a@b.com\nc@d.org\ne@f.net');
  });

  it('should deduplicate emails when unique is true', () => {
    const input = 'test@test.com, test@test.com, other@test.com';
    const result = extractEmails(input, true);
    expect(result).toBe('test@test.com\nother@test.com');
  });

  it('should return empty string for input with no emails', () => {
    const input = 'This text has no email addresses.';
    const result = extractEmails(input, false);
    expect(result).toBe('');
  });

  it('should return empty string for empty input', () => {
    const result = extractEmails('', false);
    expect(result).toBe('');
  });

  it('should handle emails with subdomains', () => {
    const input = 'user@sub.example.com';
    const result = extractEmails(input, false);
    expect(result).toBe('user@sub.example.com');
  });

  it('should handle emails with plus addressing', () => {
    const input = 'user+tag@example.com';
    const result = extractEmails(input, false);
    expect(result).toBe('user+tag@example.com');
  });

  it('should handle emails with dots in local part', () => {
    const input = 'firstname.lastname@example.com';
    const result = extractEmails(input, false);
    expect(result).toBe('firstname.lastname@example.com');
  });
});

describe('extractEmails, internationalised', () => {
  it('finds addresses with Cyrillic parts', () => {
    expect(extractEmails('Пишите на почта@пример.рф или info@example.com.', false)).toBe(
      'почта@пример.рф\ninfo@example.com',
    );
  });

  it('deduplicates ignoring case and keeps the first spelling', () => {
    expect(extractEmails('A@Example.com, a@example.com', true)).toBe('A@Example.com');
  });

  it('does not take trailing dots or surrounding letters', () => {
    expect(extractEmails('mail john.doe@company.co.uk.', false)).toBe('john.doe@company.co.uk');
  });
});
