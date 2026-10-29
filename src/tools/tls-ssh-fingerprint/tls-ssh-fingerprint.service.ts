import { type SshKexInit, hassh, looksLikeSsh, parseSshKexInit } from './hassh';
import { type Fingerprint, ja3, ja3s } from './ja3';
import { type TlsHello, alpnProtocols, isGrease, parseTlsHello, serverName, supportedVersions } from './tls-hello';

export type SshSide = 'client' | 'server';

export interface NamedFingerprint extends Fingerprint {
  name: string;
}

export interface FingerprintReport {
  /** `ClientHello`, `ServerHello` or `SSH KEXINIT`. */
  message: string;
  fingerprints: NamedFingerprint[];
  details: [label: string, value: string][];
}

const tlsVersions: Record<number, string> = {
  0x0300: 'SSL 3.0',
  0x0301: 'TLS 1.0',
  0x0302: 'TLS 1.1',
  0x0303: 'TLS 1.2',
  0x0304: 'TLS 1.3',
};

const extensionNames: Record<number, string> = {
  0: 'server_name',
  5: 'status_request',
  10: 'supported_groups',
  11: 'ec_point_formats',
  13: 'signature_algorithms',
  16: 'application_layer_protocol_negotiation',
  18: 'signed_certificate_timestamp',
  21: 'padding',
  23: 'extended_master_secret',
  27: 'compress_certificate',
  35: 'session_ticket',
  41: 'pre_shared_key',
  43: 'supported_versions',
  45: 'psk_key_exchange_modes',
  51: 'key_share',
  17513: 'application_settings',
  65037: 'encrypted_client_hello',
  65281: 'renegotiation_info',
};

const hex4 = (value: number) => `0x${value.toString(16).padStart(4, '0')}`;
export const versionName = (version: number) => tlsVersions[version] ?? hex4(version);
const extensionName = (type: number) =>
  isGrease(type) ? `GREASE (${hex4(type)})` : `${extensionNames[type] ?? 'unknown'} (${type})`;

function tlsReport(hello: TlsHello): FingerprintReport {
  const fingerprints: NamedFingerprint[] =
    hello.kind === 'client'
      ? [
          { name: 'JA3', ...ja3(hello) },
          { name: 'JA3N', ...ja3(hello, { sorted: true }) },
        ]
      : [{ name: 'JA3S', ...ja3s(hello) }];
  const versions = supportedVersions(hello).filter((version) => !isGrease(version));
  const details: [string, string][] = [
    ['version', versionName(hello.version)],
    ['supported-versions', versions.map(versionName).join(', ')],
    ['server-name', serverName(hello) ?? ''],
    ['alpn', alpnProtocols(hello).join(', ')],
    [hello.kind === 'client' ? 'cipher-suites' : 'cipher-suite', hello.cipherSuites.map(hex4).join(', ')],
    ['extensions', hello.extensions.map(({ type }) => extensionName(type)).join(', ')],
  ];
  return {
    message: hello.kind === 'client' ? 'ClientHello' : 'ServerHello',
    fingerprints,
    details: details.filter(([, value]) => value !== ''),
  };
}

function sshReport(kexInit: SshKexInit, side: SshSide): FingerprintReport {
  const client = side === 'client';
  return {
    message: 'SSH KEXINIT',
    fingerprints: [{ name: client ? 'HASSH' : 'HASSHServer', ...hassh(kexInit, side) }],
    details: [
      ['kex', kexInit.kex.join(', ')],
      ['host-key', kexInit.hostKey.join(', ')],
      ['encryption', (client ? kexInit.encryptionClientToServer : kexInit.encryptionServerToClient).join(', ')],
      ['mac', (client ? kexInit.macClientToServer : kexInit.macServerToClient).join(', ')],
      ['compression', (client ? kexInit.compressionClientToServer : kexInit.compressionServerToClient).join(', ')],
    ],
  };
}

/** Recognises a TLS hello or an SSH KEXINIT and computes its fingerprints. */
export function fingerprint(bytes: Uint8Array, { sshSide = 'client' as SshSide } = {}): FingerprintReport {
  if (bytes.length === 0) {
    throw new Error('No data');
  }
  const isTlsRecord = bytes[0] === 0x16 && bytes[1] === 0x03;
  if (!isTlsRecord && looksLikeSsh(bytes)) {
    return sshReport(parseSshKexInit(bytes), sshSide);
  }
  return tlsReport(parseTlsHello(bytes));
}
