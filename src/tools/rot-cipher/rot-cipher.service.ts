// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/rot13/service.ts and src/pages/tools/string/rotate/service.ts,
// plus a Caesar shift by any step over the Latin and Russian alphabets.

const LATIN_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CYRILLIC_LOWER = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

export type CaesarAlphabet = 'latin' | 'cyrillic' | 'both';

function shiftIn(alphabet: string, char: string, shift: number): string | undefined {
  const lower = char.toLowerCase();
  const index = alphabet.indexOf(lower);
  if (index === -1) {
    return undefined;
  }
  const shifted = alphabet[(((index + shift) % alphabet.length) + alphabet.length) % alphabet.length];
  return char === lower ? shifted : shifted.toUpperCase();
}

/** Shifts each letter by `shift` positions in its alphabet, keeping the case; other characters are kept. */
export function caesarShift(input: string, shift: number, alphabet: CaesarAlphabet = 'latin'): string {
  return Array.from(input, (char) => {
    const latin = alphabet !== 'cyrillic' ? shiftIn(LATIN_LOWER, char, shift) : undefined;
    const cyrillic = alphabet !== 'latin' ? shiftIn(CYRILLIC_LOWER, char, shift) : undefined;
    return latin ?? cyrillic ?? char;
  }).join('');
}

export function rot13(input: string): string {
  return caesarShift(input, 13, 'latin');
}

/** Moves the characters of the text circularly by `step`: `abcdef` rotated right by 2 is `efabcd`. */
export function rotate(input: string, step: number, right: boolean): string {
  const chars = Array.from(input);
  if (chars.length === 0) {
    return input;
  }
  const offset = (((right ? -step : step) % chars.length) + chars.length) % chars.length;
  return [...chars.slice(offset), ...chars.slice(0, offset)].join('');
}

export function rotateString(input: string, step: number, right: boolean, multiLine: boolean): string {
  return multiLine
    ? input
        .split('\n')
        .map((line) => rotate(line, step, right))
        .join('\n')
    : rotate(input, step, right);
}
