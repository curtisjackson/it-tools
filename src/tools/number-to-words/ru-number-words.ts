// Russian numerals with proper agreement (тысяча/тысячи/тысяч, одна/один, рубль/рубля/рублей), which `to-words` gets
// wrong for ru-RU.

type Gender = 'masculine' | 'feminine';
type Forms = [one: string, few: string, many: string];

const UNITS: Record<Gender, string[]> = {
  masculine: ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
  feminine: ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
};
const TEENS = [
  'десять',
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
];
const TENS = [
  '',
  '',
  'двадцать',
  'тридцать',
  'сорок',
  'пятьдесят',
  'шестьдесят',
  'семьдесят',
  'восемьдесят',
  'девяносто',
];
const HUNDREDS = [
  '',
  'сто',
  'двести',
  'триста',
  'четыреста',
  'пятьсот',
  'шестьсот',
  'семьсот',
  'восемьсот',
  'девятьсот',
];

const SCALES: { forms: Forms; gender: Gender }[] = [
  { forms: ['тысяча', 'тысячи', 'тысяч'], gender: 'feminine' },
  { forms: ['миллион', 'миллиона', 'миллионов'], gender: 'masculine' },
  { forms: ['миллиард', 'миллиарда', 'миллиардов'], gender: 'masculine' },
  { forms: ['триллион', 'триллиона', 'триллионов'], gender: 'masculine' },
  { forms: ['квадриллион', 'квадриллиона', 'квадриллионов'], gender: 'masculine' },
];

const FRACTIONS: Forms[] = [
  ['десятая', 'десятых', 'десятых'],
  ['сотая', 'сотых', 'сотых'],
  ['тысячная', 'тысячных', 'тысячных'],
  ['десятитысячная', 'десятитысячных', 'десятитысячных'],
  ['стотысячная', 'стотысячных', 'стотысячных'],
  ['миллионная', 'миллионных', 'миллионных'],
];

/** Picks the form for a count: 1 рубль, 2 рубля, 5 рублей, 11 рублей, 21 рубль. */
export function pluralRu(count: bigint, [one, few, many]: Forms): string {
  const mod100 = Number(count % 100n);
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  return mod10 >= 2 && mod10 <= 4 ? few : many;
}

function triadToWords(triad: number, gender: Gender): string[] {
  const words = [HUNDREDS[Math.floor(triad / 100)]];
  const rest = triad % 100;
  if (rest >= 10 && rest < 20) {
    words.push(TEENS[rest - 10]);
  } else {
    words.push(TENS[Math.floor(rest / 10)], UNITS[gender][rest % 10]);
  }
  return words.filter(Boolean);
}

/** Spells out a non-negative integer, e.g. `integerToWordsRu(2001n, 'feminine')` → `две тысячи одна`. */
export function integerToWordsRu(value: bigint, gender: Gender = 'masculine'): string {
  if (value < 0n) {
    throw new RangeError('Only non-negative integers');
  }
  if (value === 0n) {
    return 'ноль';
  }
  if (value >= 10n ** BigInt(3 * (SCALES.length + 1))) {
    throw new RangeError('Number too large');
  }
  const words: string[] = [];
  const triads: number[] = [];
  for (let rest = value; rest > 0n; rest /= 1000n) {
    triads.push(Number(rest % 1000n));
  }
  for (let i = triads.length - 1; i >= 0; i--) {
    const triad = triads[i];
    if (triad === 0) {
      continue;
    }
    if (i === 0) {
      words.push(...triadToWords(triad, gender));
    } else {
      const scale = SCALES[i - 1];
      words.push(...triadToWords(triad, scale.gender), pluralRu(BigInt(triad), scale.forms));
    }
  }
  return words.join(' ');
}

interface ParsedNumber {
  negative: boolean;
  integer: bigint;
  fraction: string;
}

/** Parses `-1 234,50` or `1234.5` without losing precision. */
export function parseDecimal(input: string): ParsedNumber {
  const normalized = input
    .trim()
    .replace(/[\s _]/g, '')
    .replace(',', '.');
  const match = normalized.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) {
    throw new Error(`Not a number: "${input}"`);
  }
  return { negative: match[1] === '-', integer: BigInt(match[2]), fraction: match[3] ?? '' };
}

/** `1.25` → `одна целая двадцать пять сотых`; integers stay as they are. */
export function numberToWordsRu(input: string): string {
  const { negative, integer, fraction } = parseDecimal(input);
  const trimmedFraction = fraction.replace(/0+$/, '');
  if (trimmedFraction.length > FRACTIONS.length) {
    throw new RangeError(`At most ${FRACTIONS.length} decimal places`);
  }
  let words: string;
  if (!trimmedFraction) {
    words = integerToWordsRu(integer);
  } else {
    const numerator = BigInt(trimmedFraction);
    words = [
      integerToWordsRu(integer, 'feminine'),
      integer % 10n === 1n && integer % 100n !== 11n ? 'целая' : 'целых',
      integerToWordsRu(numerator, 'feminine'),
      pluralRu(numerator, FRACTIONS[trimmedFraction.length - 1]),
    ].join(' ');
  }
  return negative && (integer !== 0n || trimmedFraction) ? `минус ${words}` : words;
}

/** `1234.5` → `одна тысяча двести тридцать четыре рубля пятьдесят копеек` (or `… рубля 50 копеек`). */
export function amountToWordsRu(input: string, { kopecksInDigits = false } = {}): string {
  const { negative, integer, fraction } = parseDecimal(input);
  if (fraction.length > 2 && /[1-9]/.test(fraction.slice(2))) {
    throw new RangeError('An amount has at most 2 decimal places');
  }
  const kopecks = BigInt(fraction.padEnd(2, '0').slice(0, 2));
  const rubles = `${integerToWordsRu(integer)} ${pluralRu(integer, ['рубль', 'рубля', 'рублей'])}`;
  const kopecksText = `${kopecksInDigits ? kopecks.toString().padStart(2, '0') : integerToWordsRu(kopecks, 'feminine')} ${pluralRu(kopecks, ['копейка', 'копейки', 'копеек'])}`;
  return `${negative ? 'минус ' : ''}${rubles} ${kopecksText}`;
}
