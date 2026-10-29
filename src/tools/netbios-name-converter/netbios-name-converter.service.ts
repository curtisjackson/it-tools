// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/EncodeNetBIOSName.mjs and DecodeNetBIOSName.mjs
// (first-level encoding, RFC 1001 §14.1). Extended: the 16th byte is the suffix (the service type), names are
// upper-cased as Windows does, and decoding checks the characters instead of producing garbage.

/** Well-known suffixes (the 16th byte of a NetBIOS name). */
export const netbiosSuffixes: Record<number, string> = {
  0x00: 'Workstation',
  0x03: 'Messenger',
  0x06: 'RAS Server',
  0x1b: 'Domain Master Browser',
  0x1c: 'Domain Controllers',
  0x1d: 'Master Browser',
  0x1e: 'Browser Service Elections',
  0x1f: 'NetDDE',
  0x20: 'File Server',
  0x21: 'RAS Client',
};

export interface NetbiosOptions {
  /** Added to each half-byte: 65 (`A`) in the standard. */
  offset?: number;
  /** The 16th byte, or `null` for a 16 character name padded with spaces. */
  suffix?: number | null;
  upperCase?: boolean;
}

const latin1 = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

export function encodeNetbiosName(name: string, { offset = 65, suffix = 0x20, upperCase = true }: NetbiosOptions = {}) {
  const text = upperCase ? name.toUpperCase() : name;
  const length = suffix === null ? 16 : 15;
  if (text.length > length) {
    throw new Error(`A NetBIOS name has at most ${length} characters`);
  }
  const bytes = latin1(text.padEnd(length, ' '));
  if (bytes.some((byte) => byte > 0xff)) {
    throw new Error('A NetBIOS name only contains Latin-1 characters');
  }
  if (suffix !== null) {
    bytes.push(suffix);
  }
  return bytes.map((byte) => String.fromCharCode((byte >> 4) + offset, (byte & 0xf) + offset)).join('');
}

export function decodeNetbiosName(encoded: string, { offset = 65 } = {}) {
  // A name in a packet is preceded by its length, 32, often shown as a space.
  const text = encoded.trim();
  if (text.length === 0 || text.length > 32 || text.length % 2 !== 0) {
    throw new Error('An encoded NetBIOS name has an even number of characters, 32 at most');
  }
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 2) {
    const [high, low] = [text.charCodeAt(i) - offset, text.charCodeAt(i + 1) - offset];
    if (high < 0 || high > 15 || low < 0 || low > 15) {
      throw new Error(`Invalid character "${text[high < 0 || high > 15 ? i : i + 1]}" for the offset ${offset}`);
    }
    bytes.push((high << 4) | low);
  }
  const suffix = bytes.length === 16 ? bytes[15] : undefined;
  const name = String.fromCharCode(...(suffix === undefined ? bytes : bytes.slice(0, 15))).replace(/ +$/, '');
  return { name, suffix, service: suffix === undefined ? undefined : netbiosSuffixes[suffix] };
}
