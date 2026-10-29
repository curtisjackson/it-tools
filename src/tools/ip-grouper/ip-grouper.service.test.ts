import { describe, expect, it } from 'vitest';
import { formatIpGroups, groupIps } from './ip-grouper.service';

const options = { ipv4Prefix: 24, ipv6Prefix: 64, unique: false };

describe('ip-grouper', () => {
  it('groups IPv4 and IPv6 addresses by network, sorted by value', () => {
    const { groups, invalid } = groupIps(
      '192.168.1.10\n10.0.0.2, 192.168.1.9 2001:db8::2\n192.168.1.100;2001:db8:0:1::1 2001:db8::1 10.0.0.1',
      options,
    );
    expect(invalid).toEqual([]);
    expect(groups).toEqual([
      { version: 4, network: '10.0.0.0', prefix: 24, addresses: ['10.0.0.1', '10.0.0.2'] },
      { version: 4, network: '192.168.1.0', prefix: 24, addresses: ['192.168.1.9', '192.168.1.10', '192.168.1.100'] },
      { version: 6, network: '2001:db8::', prefix: 64, addresses: ['2001:db8::1', '2001:db8::2'] },
      { version: 6, network: '2001:db8:0:1::', prefix: 64, addresses: ['2001:db8:0:1::1'] },
    ]);
  });

  it('handles addresses past 128.0.0.0 and other prefix lengths', () => {
    const { groups } = groupIps('200.1.2.3 200.1.250.1 200.2.0.1', { ...options, ipv4Prefix: 16 });
    expect(groups.map(({ network, addresses }) => [network, addresses.length])).toEqual([
      ['200.1.0.0', 2],
      ['200.2.0.0', 1],
    ]);
    expect(groupIps('8.8.8.8', { ...options, ipv4Prefix: 0 }).groups[0].network).toBe('0.0.0.0');
  });

  it('removes duplicates when asked and reports what is not an address', () => {
    const { groups, invalid } = groupIps('1.1.1.1 1.1.1.1 10.0.0.1/8 hello 300.1.1.1', { ...options, unique: true });
    expect(groups.map(({ addresses }) => addresses)).toEqual([['1.1.1.1'], ['10.0.0.1']]);
    expect(invalid).toEqual(['hello', '300.1.1.1']);
  });

  it('rejects invalid prefix lengths', () => {
    expect(() => groupIps('1.1.1.1', { ...options, ipv4Prefix: 33 })).toThrow('0–32');
    expect(() => groupIps('::1', { ...options, ipv6Prefix: -1 })).toThrow('0–128');
  });

  it('formats the groups', () => {
    const { groups } = groupIps('10.0.0.2 10.0.0.1 10.0.1.1', options);
    expect(formatIpGroups(groups)).toBe('10.0.0.0/24 (2)\n  10.0.0.1\n  10.0.0.2\n\n10.0.1.0/24 (1)\n  10.0.1.1');
    expect(formatIpGroups(groups, { onlySubnets: true, counts: false })).toBe('10.0.0.0/24\n10.0.1.0/24');
  });
});
