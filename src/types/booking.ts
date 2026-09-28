/**
 * Mirrors `Booking` in the design document's class diagram. Change the diagram first.
 */

/**
 * K3 — visible sync status. This is local state: the repository sets it as the booking moves
 * through the retry queue. The server never sends it.
 */
export type SyncStatus = 'pending' | 'failed' | 'completed';

export type Booking = {
  id: string;
  carId: string;
  /**
   * Who is renting. Plain fields rather than a Renter entity: there is no authentication in
   * scope, so a renter has no identity beyond what they type into the booking form.
   */
  renterName: string;
  renterEmail: string;
  /** ISO date `YYYY-MM-DD`. A string, not a Date, so it survives JSON round-trips. */
  startDate: string;
  /** ISO date `YYYY-MM-DD`. */
  endDate: string;
  /** DKK, fixed at booking time so a later price change does not rewrite history. */
  totalPrice: number;
  /** Full ISO-8601 timestamp, e.g. `2026-09-28T10:15:00.000Z`. */
  createdAt: string;
  syncStatus: SyncStatus;
};
