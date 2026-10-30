import { isIP } from 'is-ip';
import { toASCII } from 'punycode/';

// WHOIS over RDAP (RFC 9082, 9083): rdap.org redirects each query to the registry that holds the
// resource (RIPE, ARIN, a domain registry...), and every one of them answers with CORS headers.

export type RdapKind = 'ip' | 'autnum' | 'domain';

export interface RdapQuery {
  kind: RdapKind;
  value: string;
}

const RDAP_SERVER = 'https://rdap.org';

/** What to look up: an IP address or CIDR block, an AS number, or a domain (also from a URL). */
export function parseQuery(input: string): RdapQuery | undefined {
  let text = input.trim();
  if (!text) {
    return undefined;
  }
  const asNumber = /^(?:AS)?(\d{1,10})$/i.exec(text);
  if (asNumber) {
    return { kind: 'autnum', value: String(Number(asNumber[1])) };
  }
  const [address, prefix, ...rest] = text.split('/');
  if (!rest.length && isIP(address) && (prefix === undefined || /^\d{1,3}$/.test(prefix))) {
    const max = address.includes(':') ? 128 : 32;
    if (prefix === undefined || Number(prefix) <= max) {
      return { kind: 'ip', value: prefix === undefined ? address : `${address}/${Number(prefix)}` };
    }
    return undefined;
  }
  // A URL or an e-mail address: its host.
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(text)) {
    try {
      text = new URL(text).hostname;
    } catch {
      return undefined;
    }
  }
  text = text.replace(/^.*@/, '').replace(/\.$/, '').toLowerCase();
  if (isIP(text.replace(/^\[|\]$/g, ''))) {
    return { kind: 'ip', value: text.replace(/^\[|\]$/g, '') };
  }
  const domain = toASCII(text);
  const labels = domain.split('.');
  if (labels.length < 2 || !labels.every((label) => /^(?!-)[a-z\d-]{1,63}(?<!-)$/.test(label))) {
    return undefined;
  }
  return { kind: 'domain', value: domain };
}

export function rdapUrl(query: RdapQuery): string {
  return `${RDAP_SERVER}/${query.kind}/${query.value}`;
}

export class RdapError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function lookup(
  query: RdapQuery,
  fetcher: typeof fetch = fetch,
): Promise<{ data: RdapObject; url: string }> {
  const response = await fetcher(rdapUrl(query), { headers: { Accept: 'application/rdap+json, application/json' } });
  const body = (await response.json().catch(() => undefined)) as RdapObject | undefined;
  if (!response.ok || !body) {
    throw new RdapError(response.status, body?.title ?? body?.description?.join(' ') ?? response.statusText);
  }
  return { data: body, url: response.url || rdapUrl(query) };
}

// The parts of an RDAP object this tool shows (RFC 9083).

type VCardProperty = [name: string, parameters: Record<string, unknown>, type: string, ...values: unknown[]];

export interface RdapEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [string, VCardProperty[]];
  publicIds?: { type: string; identifier: string }[];
  entities?: RdapEntity[];
}

export interface RdapObject {
  objectClassName?: string;
  handle?: string;
  name?: string;
  type?: string;
  country?: string;
  parentHandle?: string;
  status?: string[];
  port43?: string;
  startAddress?: string;
  endAddress?: string;
  ipVersion?: string;
  cidr0_cidrs?: { v4prefix?: string; v6prefix?: string; length: number }[];
  startAutnum?: number;
  endAutnum?: number;
  ldhName?: string;
  unicodeName?: string;
  nameservers?: { ldhName?: string }[];
  secureDNS?: { delegationSigned?: boolean };
  events?: { eventAction: string; eventDate: string }[];
  remarks?: { title?: string; description?: string[] }[];
  entities?: RdapEntity[];
  title?: string;
  description?: string[];
}

export interface RdapContact {
  handle: string;
  roles: string[];
  name: string;
  kind: string;
  emails: string[];
  phones: string[];
  address: string;
}

function vcardValues(entity: RdapEntity, property: string): unknown[] {
  return (entity.vcardArray?.[1] ?? []).filter((item) => item[0] === property).map((item) => item[3]);
}

function vcardText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.flat().map(String).filter(Boolean).join(', ');
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value).replace(/^tel:/, '') : '';
}

function address(entity: RdapEntity): string {
  const adr = (entity.vcardArray?.[1] ?? []).find((item) => item[0] === 'adr');
  if (!adr) {
    return '';
  }
  // A structured address, or only its label (RIPE puts the whole address there).
  const label = (adr[1] as { label?: string }).label;
  return label ? label.replace(/\n/g, ', ') : vcardText(adr[3]);
}

/** Every contact of the object, nested ones too, one per handle with all its roles. */
export function contactsOf(object: RdapObject): RdapContact[] {
  const contacts = new Map<string, RdapContact>();
  const visit = (entity: RdapEntity) => {
    const name = vcardText(vcardValues(entity, 'fn')[0]);
    const contact: RdapContact = {
      handle: entity.handle ?? '',
      roles: entity.roles ?? [],
      name,
      kind: vcardText(vcardValues(entity, 'kind')[0]),
      emails: vcardValues(entity, 'email').map(vcardText).filter(Boolean),
      phones: vcardValues(entity, 'tel').map(vcardText).filter(Boolean),
      address: address(entity),
    };
    const key = contact.handle || `${name}|${contact.emails.join()}`;
    const known = contacts.get(key);
    if (known) {
      known.roles = [...new Set([...known.roles, ...contact.roles])];
    } else if (contact.handle || name || contact.emails.length || contact.phones.length) {
      contacts.set(key, contact);
    }
    entity.entities?.forEach(visit);
  };
  object.entities?.forEach(visit);
  return [...contacts.values()];
}

/** The e-mail addresses to report abuse to. */
export function abuseEmails(object: RdapObject): string[] {
  return [
    ...new Set(
      contactsOf(object)
        .filter((contact) => contact.roles.includes('abuse'))
        .flatMap((contact) => contact.emails),
    ),
  ];
}

/** CIDR blocks of an IP network: from the cidr0 extension when the registry gives it. */
export function cidrsOf(object: RdapObject): string[] {
  return (object.cidr0_cidrs ?? []).map((block) => `${block.v4prefix ?? block.v6prefix}/${block.length}`);
}

export function eventDate(object: RdapObject, action: string): string | undefined {
  return object.events?.find((event) => event.eventAction === action)?.eventDate;
}

export function registrarOf(object: RdapObject): string | undefined {
  const registrar = contactsOf(object).find((contact) => contact.roles.includes('registrar'));
  if (!registrar) {
    return undefined;
  }
  const entity = object.entities?.find((candidate) => candidate.handle === registrar.handle);
  const ianaId = entity?.publicIds?.find((id) => /iana/i.test(id.type))?.identifier;
  return [registrar.name || registrar.handle, ianaId && `IANA ${ianaId}`].filter(Boolean).join(' · ');
}

export function remarksOf(object: RdapObject): string[] {
  return (object.remarks ?? [])
    .map((remark) => [remark.title, ...(remark.description ?? [])].filter(Boolean).join('\n'))
    .filter(Boolean);
}
