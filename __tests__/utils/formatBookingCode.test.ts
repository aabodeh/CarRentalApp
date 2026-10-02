import { formatBookingCode, spellBookingCode } from '../../src/utils/formatBookingCode';

describe('formatBookingCode', () => {
  it('turns a local booking id into an upper-case code without the prefix', () => {
    expect(formatBookingCode('booking-mg8xk2lq-1')).toBe('MG8XK2LQ-1');
  });

  it('falls back to the whole id, upper-cased, when the id is not in the expected format', () => {
    expect(formatBookingCode('abc-42')).toBe('ABC-42');
  });

  it('never returns an empty code, even for an id that is only the prefix', () => {
    expect(formatBookingCode('booking-')).toBe('BOOKING-');
  });
});

describe('spellBookingCode', () => {
  it('spells the code one character at a time, so a screen reader does not read it as a word', () => {
    expect(spellBookingCode('MG8-1')).toBe('M G 8 - 1');
  });
});
