import type { Booking } from '../types';
import { calculateTotalPrice } from '../utils/calculateTotalPrice';
import { todayIsoDate } from '../utils/localDate';
import { hasErrors, validateBooking, type BookingErrors } from '../utils/validateBooking';
import { carRepository } from './carRepository';
import { simulateLatency } from './simulatedLatency';

/** What the UI provides. Everything else on a Booking is decided here, not by the form. */
export type BookingInput = Pick<
  Booking,
  'carId' | 'renterName' | 'renterEmail' | 'startDate' | 'endDate'
>;

/** Thrown when the input fails the same checks the form runs — the server-side re-check. */
export class InvalidBookingError extends Error {
  readonly errors: BookingErrors;

  constructor(errors: BookingErrors) {
    super('The booking is not valid');
    this.name = 'InvalidBookingError';
    this.errors = errors;
  }
}

export class BookingNotFoundError extends Error {
  readonly bookingId: string;

  constructor(bookingId: string) {
    super(`No booking with id "${bookingId}"`);
    this.name = 'BookingNotFoundError';
    this.bookingId = bookingId;
  }
}

/**
 * The contract every booking data source implements. Today: in memory. Next PR: saved locally
 * first, then sent to the API through the retry queue (K2), with the sync status (K3) tracked here.
 */
export type BookingRepository = {
  getBookings(): Promise<Booking[]>;
  /** Validates, prices and saves a booking locally, with `syncStatus: 'pending'`. */
  createBooking(input: BookingInput): Promise<Booking>;
  /**
   * Sends a pending booking to the server. Today it simply settles to `'completed'`.
   * THE K3 SEAM: the next PR replaces this with the API call and the retry queue.
   */
  syncBooking(id: string): Promise<Booking>;
};

/** A fresh in-memory repository. The app uses the shared instance below; tests make their own. */
export function createInMemoryBookingRepository(): BookingRepository {
  let bookings: Booking[] = [];
  let sequence = 0;

  const newId = () => {
    sequence += 1;
    return `booking-${Date.now().toString(36)}-${sequence}`;
  };

  return {
    async getBookings() {
      await simulateLatency();
      return bookings.map((booking) => ({ ...booking }));
    },

    async createBooking(input) {
      // Stamped when the user submits, before any waiting — not when the save happens to finish.
      const createdAt = new Date().toISOString();
      const errors = validateBooking(input, todayIsoDate());
      if (hasErrors(errors)) {
        throw new InvalidBookingError(errors);
      }

      // Look the car up while the simulated latency runs, so creating costs one delay, not two.
      const [car] = await Promise.all([carRepository.getCarById(input.carId), simulateLatency()]);

      const booking: Booking = {
        ...input,
        id: newId(),
        // Priced here, from the car's current rate — never trusted from the form.
        totalPrice: calculateTotalPrice(car.pricePerDay, input.startDate, input.endDate),
        createdAt,
        syncStatus: 'pending',
      };
      bookings = [...bookings, booking];
      return { ...booking };
    },

    async syncBooking(id) {
      await simulateLatency();
      const existing = bookings.find((booking) => booking.id === id);
      if (!existing) {
        throw new BookingNotFoundError(id);
      }
      const synced: Booking = { ...existing, syncStatus: 'completed' };
      bookings = bookings.map((booking) => (booking.id === id ? synced : booking));
      return { ...synced };
    },
  };
}

export const bookingRepository: BookingRepository = createInMemoryBookingRepository();
