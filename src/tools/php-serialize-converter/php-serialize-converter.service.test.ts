import { describe, expect, it } from 'vitest';
import { jsonToPhp, phpToJson } from './php-serialize-converter.service';

const compact = (input: string) => phpToJson(input, '');

describe('php-serialize-converter', () => {
  describe('jsonToPhp', () => {
    // Test vectors of CyberChef's PHPSerialize tests.
    it.each([
      ['[]', 'a:0:{}'],
      ['{}', 'a:0:{}'],
      ['null', 'N;'],
      ['10', 'i:10;'],
      ['14.523', 'd:14.523;'],
      ['[true, false]', 'a:2:{i:0;b:1;i:1;b:0;}'],
      ['"Test string to serialize"', 's:24:"Test string to serialize";'],
      ['[1,"abc",true,{"x":1,"y":2}]', 'a:4:{i:0;i:1;i:1;s:3:"abc";i:2;b:1;i:3;a:2:{s:1:"x";i:1;s:1:"y";i:2;}}'],
    ])('serializes %s', (input, expected) => {
      expect(jsonToPhp(input)).toBe(expected);
    });

    it('keeps the order of the keys and makes integer-like keys integers, as PHP does', () => {
      // CyberChef moved the "0" key first and kept it a string.
      expect(jsonToPhp('{"a": 10, "0": {"ab": true}, "01": 1}')).toBe(
        'a:3:{s:1:"a";i:10;i:0;a:1:{s:2:"ab";b:1;}s:2:"01";i:1;}',
      );
    });

    it('counts string lengths in UTF-8 bytes', () => {
      expect(jsonToPhp('"тест"')).toBe('s:8:"тест";');
      expect(jsonToPhp('"😀"')).toBe('s:4:"😀";');
    });

    it('keeps big integers and floats written with a dot', () => {
      expect(jsonToPhp('[9223372036854775807, 1.0, 1e3]')).toBe('a:3:{i:0;i:9223372036854775807;i:1;d:1.0;i:2;d:1e3;}');
    });

    it('serializes objects, custom serialized objects, enums and references', () => {
      expect(jsonToPhp('{"__class": "App\\\\User", "name": "Ann", "\\u0000*\\u0000id": 7}')).toBe(
        'O:8:"App\\User":2:{s:4:"name";s:3:"Ann";s:5:"\0*\0id";i:7;}',
      );
      expect(jsonToPhp('{"__class": "Money", "__serialized": "12.5"}')).toBe('C:5:"Money":4:{12.5}');
      expect(jsonToPhp('{"__enum": "Suit:Hearts"}')).toBe('E:11:"Suit:Hearts";');
      expect(jsonToPhp('[{"x": 1}, {"__ref": 2}, {"__Ref": 2}]')).toBe('a:3:{i:0;a:1:{s:1:"x";i:1;}i:1;r:2;i:2;R:2;}');
    });

    it('rejects invalid JSON', () => {
      expect(() => jsonToPhp('{"a": }')).toThrow('Unexpected character at position 6');
      expect(() => jsonToPhp('[1] 2')).toThrow('Unexpected data after the value');
      expect(() => jsonToPhp('{"a" 1}')).toThrow('Expected ":"');
    });

    it('returns nothing for an empty input', () => {
      expect(jsonToPhp('  ')).toBe('');
    });
  });

  describe('phpToJson', () => {
    // Test vectors of CyberChef's PHP Deserialize tests, as valid JSON.
    it.each([
      ['a:0:{}', '{}'],
      ['i:10;', '10'],
      ['s:17:"PHP Serialization";', '"PHP Serialization"'],
      ['a:2:{s:1:"a";i:10;i:0;a:1:{s:2:"ab";b:1;}}', '{"a":10,"0":{"ab":true}}'],
    ])('deserializes %s', (input, expected) => {
      expect(compact(input)).toBe(expected);
    });

    it('turns lists into arrays and keeps the order of the other arrays', () => {
      expect(compact('a:3:{i:0;s:1:"a";i:1;N;i:2;d:0.5;}')).toBe('["a",null,0.5]');
      expect(compact('a:2:{i:1;s:1:"a";i:0;s:1:"b";}')).toBe('{"1":"a","0":"b"}');
    });

    it('reads string lengths in UTF-8 bytes and escapes quotes', () => {
      expect(compact('s:8:"тест";')).toBe('"тест"');
      expect(compact('s:5:"a"b"c";')).toBe('"a\\"b\\"c"');
    });

    it('keeps big integers and writes the special floats as strings', () => {
      expect(compact('a:4:{i:0;i:9223372036854775807;i:1;d:1.0E+25;i:2;d:INF;i:3;d:NAN;}')).toBe(
        '[9223372036854775807,1.0E+25,"INF","NAN"]',
      );
    });

    it('reads objects, custom serialized objects, enums and references', () => {
      expect(compact('O:8:"App\\User":2:{s:4:"name";s:3:"Ann";s:5:"\0*\0id";i:7;}')).toBe(
        '{"__class":"App\\\\User","name":"Ann","\\u0000*\\u0000id":7}',
      );
      expect(compact('C:5:"Money":4:{12.5}')).toBe('{"__class":"Money","__serialized":"12.5"}');
      expect(compact('E:11:"Suit:Hearts";')).toBe('{"__enum":"Suit:Hearts"}');
      expect(compact('a:2:{i:0;O:8:"stdClass":0:{}i:1;r:2;}')).toBe('[{"__class":"stdClass"},{"__ref":2}]');
    });

    it('indents the output', () => {
      expect(phpToJson('a:2:{s:1:"a";a:1:{i:0;i:1;}s:1:"b";a:0:{}}')).toBe('{\n  "a": [\n    1\n  ],\n  "b": {}\n}');
      expect(phpToJson('a:1:{i:0;b:0;}', '\t')).toBe('[\n\tfalse\n]');
    });

    it('rejects broken input with the position of the problem', () => {
      expect(() => phpToJson('s:10:"short";')).toThrow('Unexpected end of input');
      expect(() => phpToJson('i:abc;')).toThrow('Invalid integer "abc" at byte 2');
      expect(() => phpToJson('x:1;')).toThrow('Unknown type "x" at byte 0');
      expect(() => phpToJson('a:1:{a:0:{}i:1;}')).toThrow('Array keys must be integers or strings');
      expect(() => phpToJson('i:1;i:2;')).toThrow('Unexpected data after the value');
      expect(() => phpToJson('b:2;')).toThrow('Invalid boolean');
    });

    it('round-trips', () => {
      const php = 'a:3:{s:4:"list";a:2:{i:0;i:1;i:1;d:2.5;}i:5;O:3:"Foo":1:{s:3:"bar";N;}s:6:"имя";s:6:"Аня";}';
      expect(jsonToPhp(phpToJson(php))).toBe(php);
    });
  });
});
