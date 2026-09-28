import { calculateTotalPrice } from '../../src/utils/calculateTotalPrice';

describe('calculateTotalPrice', () => {
  it('multiplies the day rate by the number of rental days', () => {
    expect(calculateTotalPrice(499, '2026-10-01', '2026-10-04')).toBe(1497);
  });

  it('charges one day for a same-day rental', () => {
    expect(calculateTotalPrice(499, '2026-10-01', '2026-10-01')).toBe(499);
  });

  it('rejects an invalid date range', () => {
    expect(() => calculateTotalPrice(499, '2026-10-04', '2026-10-01')).toThrow(RangeError);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects a day rate of %p', (rate) => {
    expect(() => calculateTotalPrice(rate, '2026-10-01', '2026-10-02')).toThrow(RangeError);
  });
});
