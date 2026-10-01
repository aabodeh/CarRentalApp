/** Who is renting: the part of the booking form that the profile also collects. */
export type RenterValues = {
  renterName: string;
  renterEmail: string;
};

/** One message per invalid field. An empty object means both are valid. */
export type RenterErrors = Partial<Record<keyof RenterValues, string>>;

/**
 * Deliberately loose: something@something.something, no spaces. The only real check of an email
 * address is sending mail to it; this only catches typos like a missing "@" or domain.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The name and email rules, in one place. The booking form (through `validateBooking`) and the
 * profile form both use them, so a name the profile accepts is always one a booking accepts.
 */
export function validateRenter(values: RenterValues): RenterErrors {
  const errors: RenterErrors = {};

  if (values.renterName.trim() === '') {
    errors.renterName = 'Enter your name.';
  }

  const email = values.renterEmail.trim();
  if (email === '') {
    errors.renterEmail = 'Enter your email address.';
  } else if (!EMAIL_SHAPE.test(email)) {
    errors.renterEmail = 'Enter a valid email address, like name@example.com.';
  }

  return errors;
}

/** What a screen reader hears when a form is submitted with problems: "2 fields need attention". */
export function fieldsNeedAttention(count: number): string {
  return `${count} ${count === 1 ? 'field needs' : 'fields need'} attention`;
}
