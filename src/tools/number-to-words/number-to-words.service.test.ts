import { describe, expect, it } from 'vitest';
import { type NumberToWordsOptions, languageForLocale, numberToWords, spellNumber } from './number-to-words.service';

const options = (overrides: Partial<NumberToWordsOptions> = {}): NumberToWordsOptions => ({
  language: 'en-US',
  currency: false,
  kopecksInDigits: false,
  letterCase: 'sentence',
  ...overrides,
});

describe('number-to-words', () => {
  it('spells out English numbers with `to-words`', () => {
    expect(spellNumber('123', options())).toBe('One hundred twenty three');
    expect(spellNumber('1 000 000', options({ letterCase: 'lower' }))).toBe('one million');
    expect(spellNumber('-5', options({ letterCase: 'upper' }))).toBe('MINUS FIVE');
    expect(spellNumber('12.5', options({ currency: true, letterCase: 'title' }))).toBe(
      'Twelve Dollars And Fifty Cents',
    );
  });

  it('uses the Russian implementation', () => {
    expect(spellNumber('2021', options({ language: 'ru' }))).toBe('Две тысячи двадцать один');
    expect(
      spellNumber('99.9', options({ language: 'ru', currency: true, kopecksInDigits: true, letterCase: 'lower' })),
    ).toBe('девяносто девять рублей 90 копеек');
  });

  it('spells out other languages', () => {
    expect(spellNumber('5', options({ language: 'de-DE' }))).toBe('Fünf');
    expect(spellNumber('21', options({ language: 'uk-UA', letterCase: 'lower' }))).toBe('двадцять один');
  });

  it('works line by line, keeping empty and invalid lines empty', () => {
    expect(numberToWords('1\n\nabc\n2', options())).toBe('One\n\n\nTwo');
    expect(numberToWords('', options())).toBe('');
  });

  it('maps app locales to languages', () => {
    expect(languageForLocale('ru')).toBe('ru');
    expect(languageForLocale('fr')).toBe('fr-FR');
    expect(languageForLocale('zh-TW')).toBe('zh-CN');
    expect(languageForLocale('el')).toBe('en-US');
  });
});
