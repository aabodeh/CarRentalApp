import { formatPrice } from '../../src/utils/formatPrice';

/** Intl uses a non-breaking space before "kr."; normalise it so the expectations stay readable. */
const plain = (s: string) => s.replace(/ /g, ' ');

describe('formatPrice', () => {
  it('formats whole kroner the Danish way, without decimals', () => {
    expect(plain(formatPrice(299))).toBe('299 kr.');
  });

  it('uses a dot as the thousands separator', () => {
    expect(plain(formatPrice(1195))).toBe('1.195 kr.');
  });

  it('shows øre with a decimal comma when the amount is not whole', () => {
    expect(plain(formatPrice(1234.5))).toBe('1.234,50 kr.');
  });

  it('formats zero', () => {
    expect(plain(formatPrice(0))).toBe('0 kr.');
  });

  it('keeps the number and currency on one line', () => {
    expect(formatPrice(299)).toContain(' ');
  });
});
