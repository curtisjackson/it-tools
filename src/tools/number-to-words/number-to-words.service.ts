// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/number/number-to-words/service.ts (line by line, via `to-words`),
// with a dedicated Russian implementation, an explicit language and a letter case option.
import { ToWords } from 'to-words';
import { amountToWordsRu, numberToWordsRu, parseDecimal } from './ru-number-words';

export type LetterCase = 'sentence' | 'lower' | 'upper' | 'title';

export interface NumberToWordsOptions {
  language: string;
  currency: boolean;
  kopecksInDigits: boolean;
  letterCase: LetterCase;
}

/** to-words locale for each app locale; Russian has its own implementation. */
export const languages: Record<string, string> = {
  ru: 'ru',
  en: 'en-US',
  'en-GB': 'en-GB',
  uk: 'uk-UA',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-BR',
  pl: 'pl-PL',
  nl: 'nl-NL',
  tr: 'tr-TR',
  zh: 'zh-CN',
  ko: 'ko-KR',
  hi: 'hi-IN',
};

export function languageForLocale(appLocale: string): string {
  return languages[appLocale] ?? languages[appLocale.split('-')[0]] ?? 'en-US';
}

function applyCase(text: string, letterCase: LetterCase): string {
  const lower = text.toLocaleLowerCase();
  switch (letterCase) {
    case 'lower':
      return lower;
    case 'upper':
      return text.toLocaleUpperCase();
    case 'title':
      return lower.replace(
        /(^|[\s-])(\p{L})/gu,
        (_, before: string, letter: string) => before + letter.toLocaleUpperCase(),
      );
    default:
      return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
  }
}

/** Spells out one number. */
export function spellNumber(
  value: string,
  { language, currency, kopecksInDigits, letterCase }: NumberToWordsOptions,
): string {
  if (language === 'ru') {
    return applyCase(currency ? amountToWordsRu(value, { kopecksInDigits }) : numberToWordsRu(value), letterCase);
  }
  const { negative, integer, fraction } = parseDecimal(value);
  const number = Number(`${negative ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`);
  const words = new ToWords({ localeCode: language }).convert(number, { currency, doNotAddOnly: true });
  return applyCase(words, letterCase);
}

/** Spells out each line; empty or invalid lines give empty lines, so the output lines match the input. */
export function numberToWords(input: string, options: NumberToWordsOptions): string {
  if (!input) {
    return '';
  }
  return input
    .split('\n')
    .map((line) => {
      if (line.trim() === '') {
        return '';
      }
      try {
        return spellNumber(line, options);
      } catch {
        return '';
      }
    })
    .join('\n');
}
