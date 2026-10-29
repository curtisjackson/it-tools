// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/lib/JA4.mjs, on the shared hello parser, following the FoxIO
// JA4 specification where CyberChef differs: without signature algorithms the extension string has no trailing
// underscore, and an empty cipher or extension list hashes to 000000000000. The JA4 method is published by FoxIO under
// the BSD 3-Clause license and JA4S under the FoxIO License 1.1; see https://github.com/FoxIO-LLC/ja4.
import { SHA256 } from 'crypto-es';
import { TLS_EXTENSION, type TlsHello, firstAlpn, isGrease, signatureAlgorithms, supportedVersions } from './tls-hello';

export interface Ja4 {
  /** Sorted and hashed, the fingerprint itself. */
  ja4: string;
  /** In the original order, hashed. */
  original: string;
  /** Sorted, not hashed. */
  raw: string;
  /** In the original order, not hashed. */
  rawOriginal: string;
}

const versionCodes: Record<number, string> = {
  0x0304: '13',
  0x0303: '12',
  0x0302: '11',
  0x0301: '10',
  0x0300: 's3',
  0x0200: 's2',
  0x0100: 's1',
};

const hex = (value: number) => value.toString(16).padStart(4, '0');
const count = (value: number) => String(Math.min(value, 99)).padStart(2, '0');
const truncatedSha256 = (text: string) => (text ? SHA256(text).toString().slice(0, 12) : '000000000000');
const isAlphanumeric = (byte: number) => /[0-9A-Za-z]/.test(String.fromCharCode(byte));

/** The highest version of supported_versions, else the version of the hello. */
function versionCode(hello: TlsHello): string {
  const versions = supportedVersions(hello).filter((version) => !isGrease(version));
  return versionCodes[versions.length > 0 ? Math.max(...versions) : hello.version] ?? '00';
}

/** The first and last characters of the first ALPN value, or of its hex form when they are not alphanumeric. */
function alpnCode(hello: TlsHello): string {
  const value = firstAlpn(hello);
  if (!value || value.length === 0) {
    return '00';
  }
  const [first, last] = [value[0], value[value.length - 1]];
  if (isAlphanumeric(first) && isAlphanumeric(last)) {
    return String.fromCharCode(first, last);
  }
  return first.toString(16).padStart(2, '0')[0] + last.toString(16).padStart(2, '0')[1];
}

export function ja4(hello: TlsHello): Ja4 {
  const ciphers = hello.cipherSuites.filter((cipher) => !isGrease(cipher)).map(hex);
  const extensions = hello.extensions.map(({ type }) => type).filter((type) => !isGrease(type));
  const sni = extensions.includes(TLS_EXTENSION.SERVER_NAME) ? 'd' : 'i';
  // QUIC is not supported: the hello always comes over TCP.
  const prefix = `t${versionCode(hello)}${sni}${count(ciphers.length)}${count(extensions.length)}${alpnCode(hello)}`;

  const algorithms = signatureAlgorithms(hello).map(hex).join(',');
  const withAlgorithms = (list: string[]) => {
    const text = list.join(',');
    return text && algorithms ? `${text}_${algorithms}` : text;
  };
  const sortedCiphers = [...ciphers].sort().join(',');
  const originalCiphers = ciphers.join(',');
  // SNI and ALPN are left out of the sorted list: they are already in the prefix.
  const sortedExtensions = withAlgorithms(
    extensions
      .filter((type) => type !== TLS_EXTENSION.SERVER_NAME && type !== TLS_EXTENSION.ALPN)
      .map(hex)
      .sort(),
  );
  const originalExtensions = withAlgorithms(extensions.map(hex));

  return {
    ja4: `${prefix}_${truncatedSha256(sortedCiphers)}_${truncatedSha256(sortedExtensions)}`,
    original: `${prefix}_${truncatedSha256(originalCiphers)}_${truncatedSha256(originalExtensions)}`,
    raw: `${prefix}_${sortedCiphers}_${sortedExtensions}`,
    rawOriginal: `${prefix}_${originalCiphers}_${originalExtensions}`,
  };
}

export function ja4s(hello: TlsHello): { ja4s: string; raw: string } {
  const extensions = hello.extensions.map(({ type }) => hex(type)).join(',');
  const prefix = `t${versionCode(hello)}${count(hello.extensions.length)}${alpnCode(hello)}_${hex(hello.cipherSuites[0])}`;
  return { ja4s: `${prefix}_${truncatedSha256(extensions)}`, raw: `${prefix}_${extensions}` };
}
