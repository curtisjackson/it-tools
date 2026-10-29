// Test cases ported from omni-tools (MIT) v0.7.0: src/pages/tools/csv/transpose-csv and csv-rows-to-columns
import { expect, describe, it } from 'vitest';
import { type InitialValuesType, csvRowsToColumns, transposeCSV } from './csv-transpose.service';

describe('transposeCsv', () => {
  it('should transpose a simple CSV', () => {
    const options: InitialValuesType = {
      separator: ',',
      commentCharacter: '#',
      customFill: false,
      customFillValue: 'x',
      quoteChar: '"',
    };
    const input = 'a,b,c\n1,2,3';
    const expectedOutput = 'a,1\nb,2\nc,3';
    const result = transposeCSV(input, options);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle an empty CSV', () => {
    const options: InitialValuesType = {
      separator: ',',
      commentCharacter: '#',
      customFill: false,
      customFillValue: 'x',
      quoteChar: '"',
    };
    const input = '';
    const expectedOutput = '';
    const result = transposeCSV(input, options);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle a single row CSV', () => {
    const options: InitialValuesType = {
      separator: ',',
      commentCharacter: '#',
      customFill: false,
      customFillValue: 'x',
      quoteChar: '"',
    };
    const input = 'a,b,c';
    const expectedOutput = 'a\nb\nc';
    const result = transposeCSV(input, options);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle a single column CSV', () => {
    const options: InitialValuesType = {
      separator: ',',
      commentCharacter: '#',
      customFill: false,
      customFillValue: 'x',
      quoteChar: '"',
    };
    const input = 'a\nb\nc';
    const expectedOutput = 'a,b,c';
    const result = transposeCSV(input, options);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle uneven rows in the CSV', () => {
    const options: InitialValuesType = {
      separator: ',',
      commentCharacter: '#',
      customFill: true,
      customFillValue: 'x',
      quoteChar: '"',
    };
    const input = 'a,b\n1,2,3';
    const expectedOutput = 'a,1\nb,2\nx,3';
    const result = transposeCSV(input, options);
    expect(result).toEqual(expectedOutput);
  });

  it('should skip comment in  the CSV', () => {
    const options: InitialValuesType = {
      separator: ',',
      commentCharacter: '#',
      customFill: true,
      customFillValue: 'x',
      quoteChar: '"',
    };
    const input = 'a,b\n1,2\n#c,3\nd,4';
    const expectedOutput = 'a,1,d\nb,2,4';
    const result = transposeCSV(input, options);
    expect(result).toEqual(expectedOutput);
  });
});

describe('csvRowsToColumns', () => {
  it('should transpose rows to columns', () => {
    const input = 'a,b,c\n1,2,3\nx,y,z';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('a,1,x\nb,2,y\nc,3,z');
  });

  it('should fill empty values with custom filler', () => {
    const input = 'a,b\n1\nx,y,z';
    const result = csvRowsToColumns(input, false, 'FILL', '#');
    expect(result).toBe('a,1,x\nb,FILL,y\nFILL,FILL,z');
  });

  it('should fill empty values with empty strings when emptyValuesFilling is true', () => {
    const input = 'a,b\n1\nx,y,z';
    const result = csvRowsToColumns(input, true, 'FILL', '#');
    expect(result).toBe('a,1,x\nb,,y\n,,z');
  });

  it('should ignore rows starting with the comment character', () => {
    const input = '#comment\n1,2,3\nx,y,z';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('1,x\n2,y\n3,z');
  });

  it('should handle an empty input', () => {
    const input = '';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('');
  });

  it('should handle input with only comments', () => {
    const input = '#comment\n#another comment';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('');
  });

  it('should handle single row input', () => {
    const input = 'a,b,c';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('a\nb\nc');
  });

  it('should handle single column input', () => {
    const input = 'a\nb\nc';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('a,b,c');
  });

  it('should handle this case onlinetools #1', () => {
    const input = 'Variety,Origin\nArabica,Ethiopia\nRobusta,Africa\nLiberica,Philippines\nMocha,\n//green tea';
    const result = csvRowsToColumns(input, false, '1x', '//');
    expect(result).toBe('Variety,Arabica,Robusta,Liberica,Mocha\nOrigin,Ethiopia,Africa,Philippines,1x');
  });

  it('should remove blank lines', () => {
    const input = 'a,b\n\n1,2\n\nx,y';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('a,1,x\nb,2,y');
  });

  it('should remove lines that contain only whitespace', () => {
    const input = 'a,b\n   \n1,2';
    const result = csvRowsToColumns(input, false, '', '#');
    expect(result).toBe('a,1\nb,2');
  });
});

describe('transposeCSV, quoting', () => {
  it('keeps cells that contain the separator quoted', () => {
    const options = { separator: ',', commentCharacter: '#', customFill: false, customFillValue: '', quoteChar: '"' };
    expect(transposeCSV('name,city\nAnn,"Paris, France"', options)).toBe('name,Ann\ncity,"Paris, France"');
  });
});
