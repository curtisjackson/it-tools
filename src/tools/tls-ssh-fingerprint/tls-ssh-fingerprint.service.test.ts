import { describe, expect, it } from 'vitest';
import { parseSshKexInit } from './hassh';
import { fingerprint } from './tls-ssh-fingerprint.service';
import { HASSH_VECTORS, JA3S_VECTORS, JA3_VECTORS } from './tls-ssh-fingerprint.vectors';
import { isGrease, parseTlsHello } from './tls-hello';
import { hexToBytes } from '@/utils/bytes';

const hash = (hex: string, name: string, options = {}) =>
  fingerprint(hexToBytes(hex), options).fingerprints.find((item) => item.name === name)?.hash;

describe('tls-ssh-fingerprint', () => {
  it.each(JA3_VECTORS)('%s', (_, hex, expected) => {
    expect(hash(hex, 'JA3')).toBe(expected);
  });

  it.each(JA3S_VECTORS)('%s', (_, hex, expected) => {
    expect(hash(hex, 'JA3S')).toBe(expected);
  });

  it('computes HASSH and HASSHServer', () => {
    const [[, client, clientHash], [, server, serverHash]] = HASSH_VECTORS;
    expect(hash(client, 'HASSH', { sshSide: 'client' })).toBe(clientHash);
    expect(hash(server, 'HASSHServer', { sshSide: 'server' })).toBe(serverHash);
  });

  it('skips the SSH banner and accepts a bare payload', () => {
    const [[, client, clientHash]] = HASSH_VECTORS;
    const packet = hexToBytes(client);
    const banner = new TextEncoder().encode('SSH-2.0-OpenSSH_9.6\r\n');
    expect(fingerprint(new Uint8Array([...banner, ...packet])).fingerprints[0].hash).toBe(clientHash);
    const padding = packet[4];
    const length = (packet[0] << 24) | (packet[1] << 16) | (packet[2] << 8) | packet[3];
    expect(fingerprint(packet.subarray(5, 4 + length - padding)).fingerprints[0].hash).toBe(clientHash);
    expect(parseSshKexInit(packet).kex.length).toBeGreaterThan(0);
  });

  it('accepts a handshake without its record header, or split over two records, followed by more data', () => {
    const [, hex, expected] = JA3_VECTORS[2];
    const record = hexToBytes(hex);
    const handshake = record.subarray(5);
    expect(fingerprint(handshake).fingerprints[0].hash).toBe(expected);

    const [first, second] = [handshake.subarray(0, 40), handshake.subarray(40)];
    const split = new Uint8Array([
      0x16,
      0x03,
      0x01,
      0x00,
      first.length,
      ...first,
      0x16,
      0x03,
      0x01,
      second.length >> 8,
      second.length & 0xff,
      ...second,
      // An application data record after the handshake.
      0x17,
      0x03,
      0x03,
      0x00,
      0x01,
      0xff,
    ]);
    expect(fingerprint(split).fingerprints[0].hash).toBe(expected);
  });

  it('describes the hello and computes JA3N', () => {
    const report = fingerprint(hexToBytes(JA3_VECTORS[3][1]));
    expect(report.message).toBe('ClientHello');
    expect(report.fingerprints.map(({ name }) => name)).toEqual(['JA3', 'JA3N']);
    const [ja3, ja3n] = report.fingerprints;
    const extensions = (text: string) => text.split(',')[2].split('-').map(Number);
    expect(extensions(ja3n.text)).toEqual([...extensions(ja3.text)].sort((a, b) => a - b));
    expect(Object.fromEntries(report.details).version).toBe('TLS 1.2');
  });

  it('recognises GREASE values', () => {
    expect([0x0a0a, 0x1a1a, 0xfafa].every(isGrease)).toBe(true);
    expect([0x0a1a, 0x0303, 0x1301].some(isGrease)).toBe(false);
  });

  it('rejects other data', () => {
    expect(() => fingerprint(new Uint8Array(0))).toThrow('No data');
    expect(() => fingerprint(hexToBytes('16030100050b000001'))).toThrow('truncated');
    expect(() => fingerprint(hexToBytes('0b00000100'))).toThrow('Not a ClientHello or ServerHello');
    expect(() => parseTlsHello(hexToBytes('010000ff0303'))).toThrow('The handshake is truncated');
    expect(() => fingerprint(hexToBytes('000000100515'))).toThrow();
  });
});
