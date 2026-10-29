// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/HASSHClientFingerprint.mjs and
// HASSHServerFingerprint.mjs. Extended: the SSH banner line before the packet is skipped, the packet may be followed by
// more data, and a bare KEXINIT payload is accepted.
import { MD5 } from 'crypto-es';
import type { Fingerprint } from './ja3';
import { ByteStream } from '@/utils/byte-stream';

export interface SshKexInit {
  kex: string[];
  hostKey: string[];
  encryptionClientToServer: string[];
  encryptionServerToClient: string[];
  macClientToServer: string[];
  macServerToClient: string[];
  compressionClientToServer: string[];
  compressionServerToClient: string[];
}

const SSH_MSG_KEXINIT = 20;

/** Whether the bytes start like an SSH KEXINIT: a banner, a packet or a payload. */
export function looksLikeSsh(bytes: Uint8Array): boolean {
  if (String.fromCharCode(...bytes.subarray(0, 4)) === 'SSH-' || bytes[0] === SSH_MSG_KEXINIT) {
    return true;
  }
  return bytes.length > 6 && bytes[5] === SSH_MSG_KEXINIT && bytes[0] === 0;
}

function skipBanner(bytes: Uint8Array): Uint8Array {
  // Lines may come before the banner (RFC 4253 §4.2); the packets start after the line starting with "SSH-".
  let start = 0;
  while (start < bytes.length) {
    const lineEnd = bytes.indexOf(10, start);
    if (lineEnd < 0) {
      break;
    }
    const isBanner = String.fromCharCode(...bytes.subarray(start, start + 4)) === 'SSH-';
    start = lineEnd + 1;
    if (isBanner) {
      return bytes.subarray(start);
    }
  }
  return bytes;
}

export function parseSshKexInit(input: Uint8Array): SshKexInit {
  let bytes = skipBanner(input);
  if (bytes[0] !== SSH_MSG_KEXINIT) {
    if (bytes.length < 6) {
      throw new Error('Not an SSH packet: too short');
    }
    const stream = new ByteStream(bytes);
    const length = stream.readInt(4);
    const padding = stream.readInt(1);
    if (length + 4 > bytes.length) {
      throw new Error(`The SSH packet is truncated: ${length} bytes announced, ${bytes.length - 4} available`);
    }
    bytes = bytes.subarray(5, 4 + length - padding);
  }
  const stream = new ByteStream(bytes);
  const code = stream.readInt(1);
  if (code !== SSH_MSG_KEXINIT) {
    throw new Error(`Not a Key Exchange Init: message code ${code}`);
  }
  stream.moveForwardsBy(16);
  const list = () => {
    const text = stream.readString(stream.readInt(4));
    return text ? text.split(',') : [];
  };
  return {
    kex: list(),
    hostKey: list(),
    encryptionClientToServer: list(),
    encryptionServerToClient: list(),
    macClientToServer: list(),
    macServerToClient: list(),
    compressionClientToServer: list(),
    compressionServerToClient: list(),
  };
}

export function hassh(kexInit: SshKexInit, side: 'client' | 'server'): Fingerprint {
  const lists =
    side === 'client'
      ? [kexInit.kex, kexInit.encryptionClientToServer, kexInit.macClientToServer, kexInit.compressionClientToServer]
      : [kexInit.kex, kexInit.encryptionServerToClient, kexInit.macServerToClient, kexInit.compressionServerToClient];
  const text = lists.map((items) => items.join(',')).join(';');
  return { hash: MD5(text).toString(), text };
}
