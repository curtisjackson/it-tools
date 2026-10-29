// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/censor/service.ts, with Unicode word boundaries: `\b` only
// knows ASCII letters, so Cyrillic words were never matched.

export interface InitialValuesType {
  wordsToCensor: string;
  censoredBySymbol: boolean;
  censorSymbol: string;
  eachLetter: boolean;
  censorWord: string;
}

export const initialValues: InitialValuesType = {
  wordsToCensor: '',
  censoredBySymbol: true,
  censorSymbol: '█',
  eachLetter: true,
  censorWord: 'CENSORED',
};

const WORD_CHAR = '[\\p{L}\\p{N}_]';

/** Replaces each listed word (one per line, case-insensitive, whole words only) by symbols or by a word. */
export function censorText(input: string, options: InitialValuesType): string {
  if (!input) {
    return '';
  }
  if (!options.wordsToCensor) {
    return input;
  }
  if (options.censoredBySymbol && !isSymbol(options.censorSymbol)) {
    throw new Error('Enter a valid censor symbol (non-alphanumeric or emoji)');
  }
  const words = options.wordsToCensor
    .split('\n')
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  let censored = input;
  for (const word of words) {
    const pattern = new RegExp(`(?<!${WORD_CHAR})${escapeRegex(word)}(?!${WORD_CHAR})`, 'giu');
    const replacement = options.censoredBySymbol
      ? options.eachLetter
        ? options.censorSymbol.repeat(Array.from(word).length)
        : options.censorSymbol
      : options.censorWord;
    censored = censored.replace(pattern, () => replacement);
  }
  return censored;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A string of non-alphanumeric characters, or an emoji. */
function isSymbol(input: string): boolean {
  return /^[^\p{L}\p{N}]+$/u.test(input) || /\p{Extended_Pictographic}/u.test(input);
}
