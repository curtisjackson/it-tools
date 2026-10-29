// Ported from CyberChef (Apache-2.0) v11.5.0: src/core/operations/GroupIPAddresses.mjs, on `ip-address`. IPv4 and IPv6
// have their own prefix length (CyberChef used one for both), addresses are sorted by value (CyberChef sorted IPv4 as
// strings and IPv6 not at all), duplicates can be removed and the lines that are not addresses are reported.
import { Address4, Address6 } from 'ip-address';

export interface IpGroupOptions {
  ipv4Prefix: number;
  ipv6Prefix: number;
  unique: boolean;
}

export interface IpGroup {
  version: 4 | 6;
  network: string;
  prefix: number;
  addresses: string[];
}

interface ParsedAddress {
  version: 4 | 6;
  text: string;
  value: bigint;
  network: string;
  networkValue: bigint;
}

function parse(token: string, options: IpGroupOptions): ParsedAddress | undefined {
  // An address may come with its own prefix length, as in `10.0.0.1/8`: only the address counts.
  const [address] = token.split('/');
  if (Address4.isValid(address)) {
    const network = new Address4(`${address}/${options.ipv4Prefix}`).startAddress();
    const ip = new Address4(address);
    return {
      version: 4,
      text: ip.correctForm(),
      value: ip.bigInt(),
      network: network.correctForm(),
      networkValue: network.bigInt(),
    };
  }
  if (Address6.isValid(address)) {
    const network = new Address6(`${address}/${options.ipv6Prefix}`).startAddress();
    const ip = new Address6(address);
    return {
      version: 6,
      text: ip.correctForm(),
      value: ip.bigInt(),
      network: network.correctForm(),
      networkValue: network.bigInt(),
    };
  }
  return undefined;
}

const compare = (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0);

export function groupIps(input: string, options: IpGroupOptions): { groups: IpGroup[]; invalid: string[] } {
  if (
    !(options.ipv4Prefix >= 0 && options.ipv4Prefix <= 32) ||
    !(options.ipv6Prefix >= 0 && options.ipv6Prefix <= 128)
  ) {
    throw new Error('The prefix length is 0–32 for IPv4 and 0–128 for IPv6');
  }
  const groups = new Map<string, { group: IpGroup; value: bigint; members: ParsedAddress[] }>();
  const invalid: string[] = [];
  for (const token of input.split(/[\s,;]+/).filter(Boolean)) {
    const parsed = parse(token, options);
    if (!parsed) {
      invalid.push(token);
      continue;
    }
    const key = `${parsed.version}|${parsed.network}`;
    let entry = groups.get(key);
    if (!entry) {
      const prefix = parsed.version === 4 ? options.ipv4Prefix : options.ipv6Prefix;
      entry = {
        group: { version: parsed.version, network: parsed.network, prefix, addresses: [] },
        value: parsed.networkValue,
        members: [],
      };
      groups.set(key, entry);
    }
    entry.members.push(parsed);
  }
  const sorted = [...groups.values()].sort((a, b) => a.group.version - b.group.version || compare(a.value, b.value));
  return {
    groups: sorted.map(({ group, members }) => {
      const addresses = members.sort((a, b) => compare(a.value, b.value)).map(({ text }) => text);
      return { ...group, addresses: options.unique ? [...new Set(addresses)] : addresses };
    }),
    invalid,
  };
}

export function formatIpGroups(groups: IpGroup[], { onlySubnets = false, counts = true } = {}): string {
  return groups
    .map(({ network, prefix, addresses }) => {
      const header = `${network}/${prefix}${counts ? ` (${addresses.length})` : ''}`;
      return onlySubnets ? header : [header, ...addresses.map((address) => `  ${address}`)].join('\n');
    })
    .join(onlySubnets ? '\n' : '\n\n');
}
