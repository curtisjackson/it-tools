// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/JA3Fingerprint.mjs and JA3SFingerprint.mjs, on the
// shared hello parser. Adds JA3N, the JA3 of the sorted extensions, which stays the same when a browser shuffles them.
import { MD5 } from 'crypto-es';
import { TLS_EXTENSION, type TlsHello, extensionList, isGrease } from './tls-hello';

const join = (values: number[]) => values.join('-');
const withoutGrease = (values: number[]) => values.filter((value) => !isGrease(value));

export interface Fingerprint {
  hash: string;
  text: string;
}

const md5 = (text: string): Fingerprint => ({ hash: MD5(text).toString(), text });

export function ja3(hello: TlsHello, { sorted = false } = {}): Fingerprint {
  const extensions = withoutGrease(hello.extensions.map(({ type }) => type));
  return md5(
    [
      hello.version,
      join(withoutGrease(hello.cipherSuites)),
      join(sorted ? [...extensions].sort((a, b) => a - b) : extensions),
      join(withoutGrease(extensionList(hello, TLS_EXTENSION.SUPPORTED_GROUPS, 2, 2))),
      join(extensionList(hello, TLS_EXTENSION.EC_POINT_FORMATS, 1, 1)),
    ].join(','),
  );
}

export function ja3s(hello: TlsHello): Fingerprint {
  return md5([hello.version, hello.cipherSuites[0], join(hello.extensions.map(({ type }) => type))].join(','));
}
