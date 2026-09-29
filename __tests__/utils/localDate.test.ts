import { addDays, isoToLocalDate, toLocalIsoDate, todayIsoDate } from '../../src/utils/localDate';

describe('localDate', () => {
  it("formats a Date as the user's local calendar day", () => {
    expect(toLocalIsoDate(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01');
  });

  it('pads single-digit months and days', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it("gives today's date for the moment passed in", () => {
    expect(todayIsoDate(new Date(2026, 8, 28, 8, 0))).toBe('2026-09-28');
  });

  it('adds days across a month and a year boundary', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('turns an ISO date back into a local Date at midnight, for the date picker', () => {
    const date = isoToLocalDate('2026-10-01');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 9, 1, 0,
    ]);
  });
});
