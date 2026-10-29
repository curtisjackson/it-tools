import { describe, expect, it } from 'vitest';
import { decodeNetbiosName, encodeNetbiosName } from './netbios-name-converter.service';

describe('netbios-name-converter', () => {
  it('passes the test vectors of CyberChef', () => {
    // CyberChef pads a 16 character name with spaces and keeps its case.
    expect(encodeNetbiosName('The NetBIOS name', { suffix: null, upperCase: false })).toBe(
      'FEGIGFCAEOGFHEECEJEPFDCAGOGBGNGF',
    );
    expect(decodeNetbiosName('FEGIGFCAEOGFHEECEJEPFDCAGOGBGNGF')).toMatchObject({
      name: 'The NetBIOS nam',
      suffix: 0x65,
    });
  });

  it('encodes a name with its suffix', () => {
    expect(encodeNetbiosName('fred')).toBe('EGFCEFEECACACACACACACACACACACACA');
    expect(encodeNetbiosName('WORKGROUP', { suffix: 0x1d })).toBe('FHEPFCELEHFCEPFFFACACACACACACABN');
  });

  it('decodes the name, the suffix and the service', () => {
    expect(decodeNetbiosName(' FHEPFCELEHFCEPFFFACACACACACACABN')).toEqual({
      name: 'WORKGROUP',
      suffix: 0x1d,
      service: 'Master Browser',
    });
    expect(decodeNetbiosName('EGFCEFEE')).toEqual({ name: 'FRED', suffix: undefined, service: undefined });
  });

  it('supports another offset', () => {
    const encoded = encodeNetbiosName('HOST', { offset: 97 });
    expect(encoded.startsWith('eiep')).toBe(true);
    expect(decodeNetbiosName(encoded, { offset: 97 }).name).toBe('HOST');
  });

  it('rejects invalid input', () => {
    expect(() => encodeNetbiosName('A-NAME-THAT-IS-TOO-LONG')).toThrow('at most 15 characters');
    expect(() => encodeNetbiosName('Имя')).toThrow('Latin-1');
    expect(() => decodeNetbiosName('ABC')).toThrow('even number');
    expect(() => decodeNetbiosName('AZ')).toThrow('Invalid character "Z"');
  });
});
