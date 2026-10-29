import { describe, expect, it } from 'vitest';
import { convertTsvToJson, initialValues } from './tsv-to-json.service';

describe('tsv-to-json', () => {
  it('converts rows to objects with typed values', () => {
    expect(
      convertTsvToJson('name\tage\tadmin\nAnn\t30\ttrue\nBob\t\tnull', { ...initialValues, indentationType: 'none' }),
    ).toBe('[{"name":"Ann","age":30,"admin":true},{"name":"Bob","age":"","admin":null}]');
  });

  it('keeps strings without dynamic types and arrays without headers', () => {
    expect(
      convertTsvToJson('1\t2', { ...initialValues, useHeaders: false, dynamicTypes: false, indentationType: 'none' }),
    ).toBe('[["1","2"]]');
  });

  it('skips comments and empty lines, handles quotes', () => {
    expect(
      convertTsvToJson('# comment\nk\tv\n\n\t\n"a\tb"\t"say ""hi"""', { ...initialValues, indentationType: 'none' }),
    ).toBe('[{"k":"a\\tb","v":"say \\"hi\\""}]');
  });

  it('indents with spaces or tabs and fills missing cells with null', () => {
    expect(convertTsvToJson('a\tb\n1', { ...initialValues, spacesCount: 4 })).toBe(
      '[\n    {\n        "a": 1,\n        "b": null\n    }\n]',
    );
    expect(convertTsvToJson('a\n1', { ...initialValues, indentationType: 'tab' })).toBe('[\n\t{\n\t\t"a": 1\n\t}\n]');
  });

  it('supports another delimiter and empty input', () => {
    expect(convertTsvToJson('a;b\n1;x', { ...initialValues, delimiter: ';', indentationType: 'none' })).toBe(
      '[{"a":1,"b":"x"}]',
    );
    expect(convertTsvToJson('', initialValues)).toBe('');
    expect(convertTsvToJson('# only comments', initialValues)).toBe('[]');
  });
});
