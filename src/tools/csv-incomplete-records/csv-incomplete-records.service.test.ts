import { describe, expect, it } from 'vitest';
import { type InitialValuesType, findIncompleteCsvRecords } from './csv-incomplete-records.service';

const options: InitialValuesType = {
  csvSeparator: ',',
  quoteCharacter: '"',
  commentCharacter: '#',
  emptyLines: true,
  emptyValues: true,
};

describe('csv-incomplete-records', () => {
  it('reports nothing for a complete CSV', () => {
    expect(findIncompleteCsvRecords('name,age\nAnn,30\nBob,25\n', options)).toEqual([]);
  });

  it('reports missing columns and empty values with the input line numbers', () => {
    expect(findIncompleteCsvRecords('# people\nname,age,city\nAnn,30\n# more\nBob,,Berlin', options)).toEqual([
      { kind: 'missing-columns', line: 3, missing: 1 },
      { kind: 'empty-values', line: 5, columns: [2] },
    ]);
  });

  it('reports empty lines when they are not ignored', () => {
    expect(findIncompleteCsvRecords('a,b\n\n1,2', { ...options, emptyLines: false })).toEqual([
      { kind: 'empty-line', line: 2 },
    ]);
    expect(findIncompleteCsvRecords('a,b\n\n1,2', options)).toEqual([]);
  });

  it('ignores empty cells when asked and respects quotes', () => {
    expect(findIncompleteCsvRecords('a,b\n,"x,y"', { ...options, emptyValues: false })).toEqual([]);
    expect(findIncompleteCsvRecords('a;b\n1;', { ...options, csvSeparator: ';' })).toEqual([
      { kind: 'empty-values', line: 2, columns: [2] },
    ]);
  });
});
