import { describe, expect, it } from 'vitest';
import { censorText, initialValues } from './text-censor.service';

describe('text-censor', () => {
  it('masks each letter of whole words, ignoring case', () => {
    expect(censorText('Bad words are BAD, badminton is fine.', { ...initialValues, wordsToCensor: 'bad' })).toBe(
      '███ words are ███, badminton is fine.',
    );
  });

  it('masks Cyrillic words, which \\b does not see', () => {
    expect(censorText('Это плохо, очень Плохо, плохой день', { ...initialValues, wordsToCensor: 'плохо' })).toBe(
      'Это █████, очень █████, плохой день',
    );
  });

  it('uses one symbol per word, or a replacement word', () => {
    expect(
      censorText('a secret b', { ...initialValues, wordsToCensor: 'secret', eachLetter: false, censorSymbol: '***' }),
    ).toBe('a *** b');
    expect(censorText('a secret b', { ...initialValues, wordsToCensor: 'secret', censoredBySymbol: false })).toBe(
      'a CENSORED b',
    );
  });

  it('handles several words, phrases and regex characters', () => {
    expect(
      censorText('top secret, c++ and a.b', {
        ...initialValues,
        wordsToCensor: 'top secret\n c++ \n\na.b',
        eachLetter: false,
        censorSymbol: '#',
      }),
    ).toBe('#, # and #');
  });

  it('keeps $ patterns in the replacement word literal', () => {
    expect(
      censorText('pay now', { ...initialValues, wordsToCensor: 'pay', censoredBySymbol: false, censorWord: '$&$1' }),
    ).toBe('$&$1 now');
  });

  it('counts emoji as one letter when masking', () => {
    expect(censorText('hi 🍕🍕 there', { ...initialValues, wordsToCensor: '🍕🍕' })).toBe('hi ██ there');
  });

  it('rejects letters as censor symbol and passes through without words', () => {
    expect(() => censorText('a b', { ...initialValues, wordsToCensor: 'a', censorSymbol: 'x' })).toThrow(
      'valid censor symbol',
    );
    expect(censorText('a b', initialValues)).toBe('a b');
    expect(censorText('', { ...initialValues, wordsToCensor: 'a' })).toBe('');
  });
});
