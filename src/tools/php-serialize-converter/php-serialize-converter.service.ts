// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/PHPSerialize.mjs and PHPDeserialize.mjs. Rewritten
// around an ordered tree: string lengths are UTF-8 bytes as in PHP (CyberChef counted characters), the order of the keys,
// big integers and `1.0` survive, lists become JSON arrays, and objects (`O:`, `C:`), enums and references are supported.

type PhpKey = { type: 'int'; value: string } | { type: 'string'; value: string };
type PhpEntries = [PhpKey, PhpNode][];

export type PhpNode =
  | { type: 'null' }
  | { type: 'bool'; value: boolean }
  | { type: 'int'; value: string }
  | { type: 'float'; value: string }
  | { type: 'string'; value: string }
  | { type: 'array'; entries: PhpEntries }
  | { type: 'object'; className: string; entries: PhpEntries }
  | { type: 'custom'; className: string; data: string }
  | { type: 'enum'; value: string }
  | { type: 'reference'; value: string; strong: boolean };

/** The JSON keys that stand for what JSON cannot express. */
export const CLASS_KEY = '__class';
export const SERIALIZED_KEY = '__serialized';
export const ENUM_KEY = '__enum';
export const REFERENCE_KEY = '__ref';
export const STRONG_REFERENCE_KEY = '__Ref';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const INTEGER = /^[+-]?\d+$/;
const FLOAT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$|^-?INF$|^NAN$/;
const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
// PHP turns the string keys that look like canonical integers into integer keys.
const INTEGER_KEY = /^(?:0|-?[1-9]\d*)$/;

const byteLength = (value: string) => encoder.encode(value).length;

/* PHP serialize() format */

class PhpReader {
  private position = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done() {
    return this.position >= this.bytes.length;
  }

  private fail(message: string): never {
    throw new Error(`${message} at byte ${this.position}`);
  }

  next(): string {
    if (this.done) {
      this.fail('Unexpected end of input');
    }
    return String.fromCharCode(this.bytes[this.position++]);
  }

  expect(expected: string) {
    for (const char of expected) {
      if (this.next() !== char) {
        this.position--;
        this.fail(`Expected "${expected}"`);
      }
    }
  }

  until(end: string): string {
    const index = this.bytes.indexOf(end.charCodeAt(0), this.position);
    if (index < 0) {
      this.fail(`Expected "${end}"`);
    }
    const token = decoder.decode(this.bytes.subarray(this.position, index));
    this.position = index + 1;
    return token;
  }

  /** Reads up to `end` a token that must match `pattern`. */
  token(end: string, pattern: RegExp, what: string): string {
    const start = this.position;
    const token = this.until(end);
    if (!pattern.test(token)) {
      this.position = start;
      this.fail(`Invalid ${what} "${token}"`);
    }
    return token;
  }

  length(end: string): number {
    return Number(this.token(end, /^\d+$/, 'length'));
  }

  read(length: number): string {
    if (this.position + length > this.bytes.length) {
      this.fail('Unexpected end of input');
    }
    const value = decoder.decode(this.bytes.subarray(this.position, this.position + length));
    this.position += length;
    return value;
  }

  quoted(length: number): string {
    this.expect('"');
    const value = this.read(length);
    this.expect('"');
    return value;
  }

  entries(): PhpEntries {
    const count = this.length(':');
    this.expect('{');
    const entries: PhpEntries = [];
    for (let i = 0; i < count; i++) {
      const key = this.value();
      if (key.type !== 'int' && key.type !== 'string') {
        this.fail('Array keys must be integers or strings');
      }
      entries.push([key, this.value()]);
    }
    this.expect('}');
    return entries;
  }

  value(): PhpNode {
    const kind = this.next();
    if (kind === 'N') {
      this.expect(';');
      return { type: 'null' };
    }
    this.expect(':');
    switch (kind) {
      case 'b': {
        return { type: 'bool', value: this.token(';', /^[01]$/, 'boolean') === '1' };
      }
      case 'i': {
        return { type: 'int', value: BigInt(this.token(';', INTEGER, 'integer')).toString() };
      }
      case 'd': {
        return { type: 'float', value: this.token(';', FLOAT, 'float') };
      }
      case 's': {
        const value = this.quoted(this.length(':'));
        this.expect(';');
        return { type: 'string', value };
      }
      case 'a':
        return { type: 'array', entries: this.entries() };
      case 'O': {
        const className = this.quoted(this.length(':'));
        this.expect(':');
        return { type: 'object', className, entries: this.entries() };
      }
      case 'C': {
        const className = this.quoted(this.length(':'));
        this.expect(':');
        const length = this.length(':');
        this.expect('{');
        const data = this.read(length);
        this.expect('}');
        return { type: 'custom', className, data };
      }
      case 'E': {
        const value = this.quoted(this.length(':'));
        this.expect(';');
        return { type: 'enum', value };
      }
      case 'r':
      case 'R': {
        return { type: 'reference', value: this.token(';', /^\d+$/, 'reference'), strong: kind === 'R' };
      }
      default:
        this.position -= 2;
        return this.fail(`Unknown type "${kind}"`);
    }
  }
}

export function parsePhp(input: string): PhpNode {
  const reader = new PhpReader(encoder.encode(input.trim()));
  const value = reader.value();
  if (!reader.done) {
    throw new Error('Unexpected data after the value');
  }
  return value;
}

function phpString(value: string) {
  return `${byteLength(value)}:"${value}"`;
}

function phpEntries(entries: PhpEntries): string {
  const body = entries.map(([key, value]) => serializePhp(key) + serializePhp(value)).join('');
  return `${entries.length}:{${body}}`;
}

export function serializePhp(node: PhpNode): string {
  switch (node.type) {
    case 'null':
      return 'N;';
    case 'bool':
      return `b:${node.value ? 1 : 0};`;
    case 'int':
      return `i:${node.value};`;
    case 'float':
      return `d:${node.value};`;
    case 'string':
      return `s:${phpString(node.value)};`;
    case 'array':
      return `a:${phpEntries(node.entries)}`;
    case 'object':
      return `O:${phpString(node.className)}:${phpEntries(node.entries)}`;
    case 'custom':
      return `C:${phpString(node.className)}:${byteLength(node.data)}:{${node.data}}`;
    case 'enum':
      return `E:${phpString(node.value)};`;
    case 'reference':
      return `${node.strong ? 'R' : 'r'}:${node.value};`;
  }
}

/* JSON */

class JsonReader {
  private position = 0;

  constructor(private readonly text: string) {}

  private fail(message: string): never {
    throw new Error(`${message} at position ${this.position}`);
  }

  private skipSpace() {
    while (/\s/.test(this.text[this.position] ?? '')) {
      this.position++;
    }
  }

  private match(pattern: RegExp): string | undefined {
    pattern.lastIndex = this.position;
    const found = pattern.exec(this.text);
    if (found) {
      this.position += found[0].length;
      return found[0];
    }
    return undefined;
  }

  private string(): string {
    const start = this.position;
    const token = this.match(/"(?:[^"\\]|\\.)*"/y);
    try {
      // Also rejects the control characters and escapes that JSON does not allow.
      return JSON.parse(token ?? '') as string;
    } catch {
      this.position = start;
      return this.fail('Expected a string');
    }
  }

  private consume(char: string): boolean {
    this.skipSpace();
    if (this.text[this.position] === char) {
      this.position++;
      return true;
    }
    return false;
  }

  private list<T>(close: string, item: () => T): T[] {
    const items: T[] = [];
    if (this.consume(close)) {
      return items;
    }
    do {
      items.push(item());
    } while (this.consume(','));
    if (!this.consume(close)) {
      this.fail(`Expected "," or "${close}"`);
    }
    return items;
  }

  value(): PhpNode {
    this.skipSpace();
    const char = this.text[this.position];
    if (char === '{') {
      this.position++;
      return objectNode(
        this.list('}', () => {
          this.skipSpace();
          const key = this.string();
          if (!this.consume(':')) {
            this.fail('Expected ":"');
          }
          return [key, this.value()] as [string, PhpNode];
        }),
      );
    }
    if (char === '[') {
      this.position++;
      const items = this.list(']', () => this.value());
      return {
        type: 'array',
        entries: items.map((item, index) => [{ type: 'int', value: String(index) }, item]),
      };
    }
    if (char === '"') {
      return { type: 'string', value: this.string() };
    }
    const number = this.match(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y);
    if (number !== undefined) {
      return /^-?\d+$/.test(number) ? { type: 'int', value: number } : { type: 'float', value: number };
    }
    const literal = this.match(/true|false|null/y);
    if (literal !== undefined) {
      return literal === 'null' ? { type: 'null' } : { type: 'bool', value: literal === 'true' };
    }
    return this.fail('Unexpected character');
  }

  end() {
    this.skipSpace();
    if (this.position < this.text.length) {
      this.fail('Unexpected data after the value');
    }
  }
}

function objectNode(members: [string, PhpNode][]): PhpNode {
  const single = members.length === 1 ? members[0] : undefined;
  if (single?.[0] === ENUM_KEY && single[1].type === 'string') {
    return { type: 'enum', value: single[1].value };
  }
  if ((single?.[0] === REFERENCE_KEY || single?.[0] === STRONG_REFERENCE_KEY) && single[1].type === 'int') {
    return { type: 'reference', value: single[1].value, strong: single[0] === STRONG_REFERENCE_KEY };
  }
  const className = members.find(([key]) => key === CLASS_KEY)?.[1];
  const rest = members.filter(([key]) => key !== CLASS_KEY);
  const toEntries = (list: [string, PhpNode][]): PhpEntries =>
    list.map(([key, value]) => [
      INTEGER_KEY.test(key) ? { type: 'int', value: key } : { type: 'string', value: key },
      value,
    ]);
  if (className?.type === 'string') {
    const [first] = rest;
    if (rest.length === 1 && first[0] === SERIALIZED_KEY && first[1].type === 'string') {
      return { type: 'custom', className: className.value, data: first[1].value };
    }
    return { type: 'object', className: className.value, entries: toEntries(rest) };
  }
  return { type: 'array', entries: toEntries(members) };
}

export function parseJson(input: string): PhpNode {
  const reader = new JsonReader(input);
  const value = reader.value();
  reader.end();
  return value;
}

function jsonNumber(value: string): string {
  if (JSON_NUMBER.test(value)) {
    return value;
  }
  const number = Number(value);
  // INF and NAN have no JSON form.
  return Number.isFinite(number) ? String(number) : JSON.stringify(value);
}

function isList(entries: PhpEntries) {
  return entries.every(([key], index) => key.type === 'int' && key.value === String(index));
}

/** Writes a node as JSON; an empty `indent` writes it on one line. */
export function stringifyJson(node: PhpNode, indent = '  ', depth = 0): string {
  const members = (items: string[], open: string, close: string) => {
    if (items.length === 0) {
      return open + close;
    }
    if (!indent) {
      return open + items.join(',') + close;
    }
    const inner = indent.repeat(depth + 1);
    return `${open}\n${items.map((item) => inner + item).join(',\n')}\n${indent.repeat(depth)}${close}`;
  };
  const separator = indent ? ': ' : ':';
  const member = (key: string, value: PhpNode) =>
    JSON.stringify(key) + separator + stringifyJson(value, indent, depth + 1);
  const entryMembers = (entries: PhpEntries) => entries.map(([key, value]) => member(key.value, value));

  switch (node.type) {
    case 'null':
      return 'null';
    case 'bool':
      return String(node.value);
    case 'int':
      return node.value;
    case 'float':
      return jsonNumber(node.value);
    case 'string':
      return JSON.stringify(node.value);
    case 'array':
      return isList(node.entries) && node.entries.length > 0
        ? members(
            node.entries.map(([, value]) => stringifyJson(value, indent, depth + 1)),
            '[',
            ']',
          )
        : members(entryMembers(node.entries), '{', '}');
    case 'object':
      return members(
        [JSON.stringify(CLASS_KEY) + separator + JSON.stringify(node.className), ...entryMembers(node.entries)],
        '{',
        '}',
      );
    case 'custom':
      return members(
        [
          JSON.stringify(CLASS_KEY) + separator + JSON.stringify(node.className),
          JSON.stringify(SERIALIZED_KEY) + separator + JSON.stringify(node.data),
        ],
        '{',
        '}',
      );
    case 'enum':
      return members([JSON.stringify(ENUM_KEY) + separator + JSON.stringify(node.value)], '{', '}');
    case 'reference':
      return members(
        [JSON.stringify(node.strong ? STRONG_REFERENCE_KEY : REFERENCE_KEY) + separator + node.value],
        '{',
        '}',
      );
  }
}

export function jsonToPhp(input: string): string {
  return input.trim() ? serializePhp(parseJson(input)) : '';
}

export function phpToJson(input: string, indent = '  '): string {
  return input.trim() ? stringifyJson(parsePhp(input), indent) : '';
}
