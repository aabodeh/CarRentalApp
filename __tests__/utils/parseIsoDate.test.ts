import { parseIsoDate } from '../../src/utils/parseIsoDate';

describe('parseIsoDate', () => {
  it('parses a YYYY-MM-DD string as midnight UTC', () => {
    expect(parseIsoDate('2026-10-01').toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('accepts 29 February in a leap year', () => {
    expect(parseIsoDate('2028-02-29').getUTCDate()).toBe(29);
  });

  it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-1-1', '01-10-2026', ''])(
    'rejects %p as not a real calendar date',
    (input) => {
      expect(() => parseIsoDate(input)).toThrow(RangeError);
    }
  );

  it('rejects a full timestamp, because booking dates are date-only', () => {
    expect(() => parseIsoDate('2026-10-01T10:00:00Z')).toThrow(RangeError);
  });
});
