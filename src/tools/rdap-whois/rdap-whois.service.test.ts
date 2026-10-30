import { describe, expect, it } from 'vitest';
import arinIpJson from './fixtures/ip-arin.json';
import ripeIpJson from './fixtures/ip-ripe.json';
import arinAutnumJson from './fixtures/autnum-arin.json';
import verisignDomainJson from './fixtures/domain-verisign.json';
import {
  type RdapObject,
  RdapError,
  abuseEmails,
  cidrsOf,
  contactsOf,
  eventDate,
  lookup,
  parseQuery,
  rdapUrl,
  registrarOf,
} from './rdap-whois.service';

// Saved answers of the registries, typed as the parts this tool reads.
const arinIp = arinIpJson as unknown as RdapObject;
const ripeIp = ripeIpJson as unknown as RdapObject;
const arinAutnum = arinAutnumJson as unknown as RdapObject;
const verisignDomain = verisignDomainJson as unknown as RdapObject;

describe('rdap-whois', () => {
  describe('parseQuery', () => {
    it('recognizes addresses, blocks and AS numbers', () => {
      expect(parseQuery(' 93.123.109.230 ')).toEqual({ kind: 'ip', value: '93.123.109.230' });
      expect(parseQuery('2a00:1450:4001:80b::200e')).toEqual({ kind: 'ip', value: '2a00:1450:4001:80b::200e' });
      expect(parseQuery('8.8.8.0/24')).toEqual({ kind: 'ip', value: '8.8.8.0/24' });
      expect(parseQuery('2001:db8::/32')).toEqual({ kind: 'ip', value: '2001:db8::/32' });
      expect(parseQuery('8.8.8.0/33')).toBeUndefined();
      expect(parseQuery('AS15169')).toEqual({ kind: 'autnum', value: '15169' });
      expect(parseQuery('as015169')).toEqual({ kind: 'autnum', value: '15169' });
      expect(parseQuery('15169')).toEqual({ kind: 'autnum', value: '15169' });
    });

    it('takes domains from URLs and e-mail addresses, in punycode', () => {
      expect(parseQuery('Example.COM.')).toEqual({ kind: 'domain', value: 'example.com' });
      expect(parseQuery('https://www.example.com/path?q=1')).toEqual({ kind: 'domain', value: 'www.example.com' });
      expect(parseQuery('admin@example.org')).toEqual({ kind: 'domain', value: 'example.org' });
      expect(parseQuery('пример.рф')).toEqual({ kind: 'domain', value: 'xn--e1afmkfd.xn--p1ai' });
      expect(parseQuery('http://[2001:db8::1]:8080/')).toEqual({ kind: 'ip', value: '2001:db8::1' });
      expect(parseQuery('localhost')).toBeUndefined();
      expect(parseQuery('bad_name.com')).toBeUndefined();
      expect(parseQuery('')).toBeUndefined();
    });

    it('builds the rdap.org URL', () => {
      expect(rdapUrl({ kind: 'ip', value: '8.8.8.0/24' })).toBe('https://rdap.org/ip/8.8.8.0/24');
      expect(rdapUrl({ kind: 'autnum', value: '15169' })).toBe('https://rdap.org/autnum/15169');
    });
  });

  describe('responses', () => {
    it('finds nested contacts and merges the roles of one handle (ARIN)', () => {
      const contacts = contactsOf(arinIp);
      expect(contacts.map((contact) => contact.handle)).toEqual(['GOGL', 'ABUSE5250-ARIN', 'ZG39-ARIN']);
      expect(contacts[1]).toMatchObject({
        roles: ['abuse'],
        name: 'Abuse',
        emails: ['network-abuse@google.com'],
        phones: ['+1-650-253-0000'],
      });
      expect(abuseEmails(arinIp)).toEqual(['network-abuse@google.com']);
      expect(cidrsOf(arinIp)).toEqual(['8.8.8.0/24']);
      expect(
        contactsOf(arinAutnum)
          .find((contact) => contact.handle === 'ZG39-ARIN')
          ?.roles.sort(),
      ).toEqual(['administrative', 'technical']);
    });

    it('reads the address label of RIPE contacts', () => {
      const contacts = contactsOf(ripeIp);
      expect(contacts.find((contact) => contact.handle === 'GOOG1-RIPE')?.address).toContain('DUBLIN');
      expect(cidrsOf(ripeIp)).toEqual(['2a00:1450:4000::/37']);
      expect(eventDate(ripeIp, 'registration')).toMatch(/^\d{4}-/);
    });

    it('names the registrar of a domain, and skips empty contacts', () => {
      const domain = verisignDomain;
      expect(registrarOf(domain)).toContain('Internet Assigned Numbers Authority');
      expect(contactsOf(domain)).toHaveLength(1);
      expect(eventDate(domain, 'expiration')).toBe('2027-08-13T04:00:00Z');
    });
  });

  describe('lookup', () => {
    it('returns the object and the URL that answered', async () => {
      const fetcher = (async () => {
        const response = new Response(JSON.stringify(arinIp), { status: 200 });
        Object.defineProperty(response, 'url', { value: 'https://rdap.arin.net/registry/ip/8.8.8.8' });
        return response;
      }) as unknown as typeof fetch;
      const result = await lookup({ kind: 'ip', value: '8.8.8.8' }, fetcher);
      expect(result.data.handle).toBe('NET-8-8-8-0-2');
      expect(result.url).toBe('https://rdap.arin.net/registry/ip/8.8.8.8');
    });

    it('turns an RDAP error into an RdapError with its status', async () => {
      const body = { errorCode: 404, title: 'No RDAP service is available for this resource' };
      const fetcher = (async () => new Response(JSON.stringify(body), { status: 404 })) as unknown as typeof fetch;
      const error = await lookup({ kind: 'domain', value: 'yandex.ru' }, fetcher).catch((cause) => cause);
      expect(error).toBeInstanceOf(RdapError);
      expect(error).toMatchObject({ status: 404, message: 'No RDAP service is available for this resource' });
    });
  });
});
