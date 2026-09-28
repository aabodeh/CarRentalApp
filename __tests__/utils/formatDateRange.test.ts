import { formatDateRange } from '../../src/utils/formatDateRange';

describe('formatDateRange', () => {
  it('shows a same-day rental as a single date', () => {
    expect(formatDateRange('2026-10-01', '2026-10-01')).toBe('1. okt. 2026');
  });

  it('collapses the month and year when both dates share them', () => {
    expect(formatDateRange('2026-10-01', '2026-10-03')).toBe('1.–3. okt. 2026');
  });

  it('collapses only the year across a month boundary', () => {
    expect(formatDateRange('2026-09-30', '2026-10-03')).toBe('30. sep.–3. okt. 2026');
  });

  it('writes both years across a year boundary', () => {
    expect(formatDateRange('2026-12-30', '2027-01-02')).toBe('30. dec. 2026–2. jan. 2027');
  });

  it('uses "maj" without a dot, as Danish does', () => {
    expect(formatDateRange('2026-05-04', '2026-05-04')).toBe('4. maj 2026');
  });

  it('rejects a range that ends before it starts', () => {
    expect(() => formatDateRange('2026-10-03', '2026-10-01')).toThrow(RangeError);
  });
});
