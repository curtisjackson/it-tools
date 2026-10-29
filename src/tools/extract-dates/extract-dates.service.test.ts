import { describe, expect, it } from 'vitest';
import { extractDates } from './extract-dates.service';

const texts = (input: string, options = {}) => extractDates(input, options).map((date) => date.text);

describe('extract-dates', () => {
  it('finds the formats CyberChef finds', () => {
    // Test vector of CyberChef's ExtractDates browser test.
    expect(texts('Date: 1945-05-08, 08.05.1945 and 08/05/1945.')).toEqual(['1945-05-08', '08.05.1945', '08/05/1945']);
  });

  it('finds month-first dates when asked', () => {
    expect(extractDates('on 12/31/1999', { order: 'mdy' })).toEqual([{ text: '12/31/1999', iso: '1999-12-31' }]);
    expect(texts('on 12/31/1999')).toEqual([]);
  });

  it('drops dates that do not exist', () => {
    expect(texts('31.02.2021 29.02.2023 29.02.2024 2021-04-31')).toEqual(['29.02.2024']);
  });

  it('keeps the time of ISO date-times', () => {
    expect(extractDates('at 2024-03-01T12:30:00Z and 2024-03-02 08:15')).toEqual([
      { text: '2024-03-01T12:30:00Z', iso: '2024-03-01T12:30:00Z' },
      { text: '2024-03-02 08:15', iso: '2024-03-02T08:15' },
    ]);
  });

  it('accepts single-digit days and months, but requires one separator kind', () => {
    expect(extractDates('1.5.2020')).toEqual([{ text: '1.5.2020', iso: '2020-05-01' }]);
    expect(texts('01.05-2020')).toEqual([]);
  });

  it('does not match inside longer numbers or versions', () => {
    expect(texts('v1.2.2024.5 id 1201.05.2020 12.05.20201')).toEqual([]);
  });

  it('removes duplicates by date when asked', () => {
    expect(texts('2020-01-02 02.01.2020 2020-01-02', { unique: true })).toEqual(['2020-01-02']);
  });
});
