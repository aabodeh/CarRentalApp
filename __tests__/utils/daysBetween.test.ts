import { daysBetween } from '../../src/utils/daysBetween';

describe('daysBetween', () => {
  it('counts rental days as 24-hour periods between pick-up and return', () => {
    expect(daysBetween('2026-10-01', '2026-10-03')).toBe(2);
  });

  it('charges a same-day rental as one day', () => {
    expect(daysBetween('2026-10-01', '2026-10-01')).toBe(1);
  });

  it('counts across a month boundary', () => {
    expect(daysBetween('2026-09-29', '2026-10-02')).toBe(3);
  });

  it('counts across a year boundary', () => {
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('is not thrown off by the daylight-saving change on 25 October 2026', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('rejects a range that ends before it starts', () => {
    expect(() => daysBetween('2026-10-03', '2026-10-01')).toThrow(RangeError);
  });

  it('rejects a malformed date', () => {
    expect(() => daysBetween('2026-10-01', 'next tuesday')).toThrow(RangeError);
  });
});
