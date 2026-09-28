import {
  hasErrors,
  validateBooking,
  type BookingFormValues,
} from '../../src/utils/validateBooking';

const TODAY = '2026-09-28';

const valid: BookingFormValues = {
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
};

describe('validateBooking', () => {
  it('accepts a complete, valid booking', () => {
    expect(validateBooking(valid, TODAY)).toEqual({});
    expect(hasErrors(validateBooking(valid, TODAY))).toBe(false);
  });

  it('accepts a same-day rental starting today', () => {
    expect(validateBooking({ ...valid, startDate: TODAY, endDate: TODAY }, TODAY)).toEqual({});
  });

  it.each(['', '   '])('rejects a blank name (%p)', (renterName) => {
    expect(validateBooking({ ...valid, renterName }, TODAY).renterName).toBe('Enter your name.');
  });

  it('asks for an email when it is blank', () => {
    expect(validateBooking({ ...valid, renterEmail: ' ' }, TODAY).renterEmail).toBe(
      'Enter your email address.'
    );
  });

  it.each(['mette', 'mette@', 'mette@example', '@example.dk', 'me tte@example.dk'])(
    'rejects %p as not shaped like an email',
    (renterEmail) => {
      expect(validateBooking({ ...valid, renterEmail }, TODAY).renterEmail).toBe(
        'Enter a valid email address, like name@example.com.'
      );
    }
  );

  it('rejects an end date before the start date', () => {
    const errors = validateBooking(
      { ...valid, startDate: '2026-10-03', endDate: '2026-10-01' },
      TODAY
    );
    expect(errors).toEqual({ endDate: 'Return must be on or after the pick-up date.' });
  });

  it('rejects a pick-up date in the past', () => {
    expect(validateBooking({ ...valid, startDate: '2026-09-27' }, TODAY).startDate).toBe(
      "Pick-up can't be in the past."
    );
  });

  it('rejects a return date in the past', () => {
    const errors = validateBooking(
      { ...valid, startDate: '2026-09-20', endDate: '2026-09-21' },
      TODAY
    );
    expect(errors.endDate).toBe("Return can't be in the past.");
  });

  it('rejects a date that is not a real calendar date', () => {
    expect(validateBooking({ ...valid, startDate: '2026-02-30' }, TODAY).startDate).toBe(
      'Choose a pick-up date.'
    );
  });

  it('reports every problem at once, so the user can fix them in one pass', () => {
    const errors = validateBooking(
      { renterName: '', renterEmail: 'x', startDate: '2026-09-01', endDate: '2026-08-01' },
      TODAY
    );
    expect(Object.keys(errors).sort()).toEqual([
      'endDate',
      'renterEmail',
      'renterName',
      'startDate',
    ]);
  });
});
