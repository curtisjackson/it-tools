import { describe, expect, it } from 'vitest';
import { defaultCsvOptions, getCsvHeaders, joinCsv, joinCsvLine, splitCsv, splitCsvLine } from './csv';

describe('csv', () => {
  describe('splitCsvLine', () => {
    it('splits and trims cells', () => {
      expect(splitCsvLine('a, b ,c')).toEqual(['a', 'b', 'c']);
    });

    it('keeps delimiters and doubled quotes inside quoted cells', () => {
      expect(splitCsvLine('"a,b","say ""hi""",c')).toEqual(['a,b', 'say "hi"', 'c']);
    });

    it('supports other delimiters and quote characters', () => {
      expect(splitCsvLine("'a;b';c", ';', "'")).toEqual(['a;b', 'c']);
      expect(splitCsvLine('a\tb', '\t')).toEqual(['a', 'b']);
    });

    it('keeps empty cells', () => {
      expect(splitCsvLine('a,,c,')).toEqual(['a', '', 'c', '']);
    });
  });

  describe('splitCsv', () => {
    it('removes comments and empty lines by default', () => {
      expect(splitCsv('# comment\na,b\n\n , \nc,d\r\n')).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('keeps comments and empty lines when asked', () => {
      expect(splitCsv('#x\na\n', { ...defaultCsvOptions, deleteComment: false, deleteEmptyLines: false })).toEqual([
        ['#x'],
        ['a'],
        [''],
      ]);
    });

    it('returns no rows for empty input', () => {
      expect(splitCsv('')).toEqual([]);
    });
  });

  describe('getCsvHeaders', () => {
    it('returns the first data line without BOM', () => {
      expect(getCsvHeaders('\n# c\n\uFEFFname, age\n1,2', ',', '"', '#')).toEqual(['name', 'age']);
    });

    it('returns nothing for empty input', () => {
      expect(getCsvHeaders('')).toEqual([]);
    });
  });

  describe('joinCsvLine', () => {
    it('quotes only cells that need it', () => {
      expect(joinCsvLine(['a', 'b,c', 'say "hi"', 'x\ny'])).toBe('a,"b,c","say ""hi""","x\ny"');
    });

    it('quotes every cell when asked', () => {
      expect(joinCsvLine(['a', 'b'], ';', "'", true)).toBe("'a';'b'");
    });

    it('round-trips through splitCsvLine', () => {
      const cells = ['plain', 'with,comma', 'with "quote"'];
      expect(splitCsvLine(joinCsvLine(cells))).toEqual(cells);
    });
  });

  it('joinCsv joins rows with line breaks', () => {
    expect(
      joinCsv(
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
        '\t',
      ),
    ).toBe('a\tb\nc\td');
  });
});
