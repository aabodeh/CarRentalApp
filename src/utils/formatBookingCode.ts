/** The prefix every local booking id starts with (see `newId` in bookingRepository.ts). */
const ID_PREFIX = 'booking-';

/**
 * The booking code the user shows at pick-up: the booking's local id without its prefix,
 * upper-cased. `booking-mg8xk2lq-1` → `MG8XK2LQ-1`.
 *
 * Not a new identifier: the id is sent to the server as `clientBookingId`, so the code names
 * something the server can look up. An id in any other format is shown whole, upper-cased.
 */
export function formatBookingCode(bookingId: string): string {
  const rest = bookingId.startsWith(ID_PREFIX) ? bookingId.slice(ID_PREFIX.length) : '';
  return (rest || bookingId).toUpperCase();
}

/** "MG8-1" → "M G 8 - 1": what a screen reader should say, one character at a time. */
export function spellBookingCode(code: string): string {
  return code.split('').join(' ');
}
