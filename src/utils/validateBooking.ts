import { parseIsoDate } from './parseIsoDate';

/** What the booking form collects. Dates are `YYYY-MM-DD`. */
export type BookingFormValues = {
  renterName: string;
  renterEmail: string;
  startDate: string;
  endDate: string;
};

export type BookingField = keyof BookingFormValues;

/** One message per invalid field. An empty object means the booking is valid. */
export type BookingErrors = Partial<Record<BookingField, string>>;

/** Order of the fields on screen, so the UI can move focus to the first problem. */
export const BOOKING_FIELDS: readonly BookingField[] = [
  'renterName',
  'renterEmail',
  'startDate',
  'endDate',
];

/**
 * Deliberately loose: something@something.something, no spaces. The only real check of an email
 * address is sending mail to it; this only catches typos like a missing "@" or domain.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRealDate = (value: string) => {
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks a booking before it is created. Used by the form (to show errors) and by
 * bookingRepository (which re-checks, the way a server would). Returns every problem at once.
 *
 * `today` is the user's local date (`todayIsoDate()`), passed in so tests do not depend on the
 * clock. ISO dates compare correctly as strings, so no Date objects are needed here.
 */
export function validateBooking(values: BookingFormValues, today: string): BookingErrors {
  const errors: BookingErrors = {};

  if (values.renterName.trim() === '') {
    errors.renterName = 'Enter your name.';
  }

  const email = values.renterEmail.trim();
  if (email === '') {
    errors.renterEmail = 'Enter your email address.';
  } else if (!EMAIL_SHAPE.test(email)) {
    errors.renterEmail = 'Enter a valid email address, like name@example.com.';
  }

  const startValid = isRealDate(values.startDate);
  const endValid = isRealDate(values.endDate);

  if (!startValid) {
    errors.startDate = 'Choose a pick-up date.';
  } else if (values.startDate < today) {
    errors.startDate = "Pick-up can't be in the past.";
  }

  if (!endValid) {
    errors.endDate = 'Choose a return date.';
  } else if (values.endDate < today) {
    errors.endDate = "Return can't be in the past.";
  } else if (startValid && values.endDate < values.startDate) {
    errors.endDate = 'Return must be on or after the pick-up date.';
  }

  return errors;
}

export function hasErrors(errors: BookingErrors): boolean {
  return Object.keys(errors).length > 0;
}
