import { describe, expect, it } from 'vitest';
import { amountToWordsRu, integerToWordsRu, numberToWordsRu, parseDecimal, pluralRu } from './ru-number-words';

describe('ru-number-words', () => {
  it('picks plural forms', () => {
    const forms: [string, string, string] = ['рубль', 'рубля', 'рублей'];
    expect([0n, 1n, 2n, 4n, 5n, 11n, 12n, 14n, 21n, 22n, 25n, 111n, 101n].map((n) => pluralRu(n, forms))).toEqual([
      'рублей',
      'рубль',
      'рубля',
      'рубля',
      'рублей',
      'рублей',
      'рублей',
      'рублей',
      'рубль',
      'рубля',
      'рублей',
      'рублей',
      'рубль',
    ]);
  });

  it('spells out integers with agreeing scales', () => {
    expect(integerToWordsRu(0n)).toBe('ноль');
    expect(integerToWordsRu(15n)).toBe('пятнадцать');
    expect(integerToWordsRu(101n)).toBe('сто один');
    expect(integerToWordsRu(1000n)).toBe('одна тысяча');
    expect(integerToWordsRu(2001n)).toBe('две тысячи один');
    expect(integerToWordsRu(2001n, 'feminine')).toBe('две тысячи одна');
    expect(integerToWordsRu(5_000_000n)).toBe('пять миллионов');
    expect(integerToWordsRu(1_234_567n)).toBe('один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь');
    expect(integerToWordsRu(11_000n)).toBe('одиннадцать тысяч');
    expect(integerToWordsRu(21_000_000_000n)).toBe('двадцать один миллиард');
    expect(integerToWordsRu(10n ** 15n)).toBe('один квадриллион');
    expect(() => integerToWordsRu(10n ** 18n)).toThrow('too large');
  });

  it('spells out decimals', () => {
    expect(numberToWordsRu('1,5')).toBe('одна целая пять десятых');
    expect(numberToWordsRu('2.25')).toBe('две целых двадцать пять сотых');
    expect(numberToWordsRu('0.001')).toBe('ноль целых одна тысячная');
    expect(numberToWordsRu('11.1')).toBe('одиннадцать целых одна десятая');
    expect(numberToWordsRu('21.21')).toBe('двадцать одна целая двадцать одна сотая');
    expect(numberToWordsRu('3.10')).toBe('три целых одна десятая');
    expect(numberToWordsRu('7.000')).toBe('семь');
    expect(() => numberToWordsRu('1.1234567')).toThrow('decimal places');
  });

  it('handles signs and spaces', () => {
    expect(numberToWordsRu('-42')).toBe('минус сорок два');
    expect(numberToWordsRu('-0')).toBe('ноль');
    expect(numberToWordsRu('1 000 000')).toBe('один миллион');
    expect(parseDecimal('+12_345,6')).toEqual({ negative: false, integer: 12345n, fraction: '6' });
    expect(() => parseDecimal('12a')).toThrow('Not a number');
  });

  it('writes amounts in rubles and kopecks', () => {
    expect(amountToWordsRu('1234.5')).toBe('одна тысяча двести тридцать четыре рубля пятьдесят копеек');
    expect(amountToWordsRu('21')).toBe('двадцать один рубль ноль копеек');
    expect(amountToWordsRu('2,01', { kopecksInDigits: true })).toBe('два рубля 01 копейка');
    expect(amountToWordsRu('0.02')).toBe('ноль рублей две копейки');
    expect(amountToWordsRu('5.000')).toBe('пять рублей ноль копеек');
    expect(() => amountToWordsRu('1.234')).toThrow('2 decimal places');
  });
});
