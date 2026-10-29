// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/email-extractor/service.ts, extended to internationalised
// addresses (e.g. Cyrillic domains) and case-insensitive deduplication.

const EMAIL_REGEX =
  /(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}(?![\p{L}\p{N}])/gu;

/** Lists the e-mail addresses found in the text, one per line; `unique` drops repeats ignoring case. */
export function extractEmails(input: string, unique: boolean): string {
  if (!input) {
    return '';
  }
  const matches = input.match(EMAIL_REGEX);
  if (!matches) {
    return '';
  }
  if (!unique) {
    return matches.join('\n');
  }
  const seen = new Set<string>();
  return matches
    .filter((email) => {
      const key = email.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .join('\n');
}
