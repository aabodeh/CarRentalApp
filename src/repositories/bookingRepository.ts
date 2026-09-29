import { postBooking as postBookingToApi } from '../services/api/bookingApi';
import { isUnreachable } from '../services/api/client';
import { bookingStore } from '../storage/bookingStore';
import type { Booking, Car } from '../types';
import { calculateTotalPrice } from '../utils/calculateTotalPrice';
import { todayIsoDate } from '../utils/localDate';
import { hasErrors, validateBooking, type BookingErrors } from '../utils/validateBooking';
import { carRepository } from './carRepository';

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
 * The contract every booking source implements. Bookings are saved on the phone first, so
 * creating one never needs the network; syncing sends it to the API.
 */
export type BookingRepository = {
  getBookings(): Promise<Booking[]>;
  /** Validates, prices and saves a booking on the phone, with `syncStatus: 'pending'`. */
  createBooking(input: BookingInput): Promise<Booking>;
  /**
   * Sends a pending booking to the API (K3):
   * - accepted            → `completed`
   * - server unreachable  → stays `pending`, to be retried (PR 5 adds the retry queue, K2)
   * - rejected by server  → `failed`
   */
  syncBooking(id: string): Promise<Booking>;
};

type Dependencies = {
  store: { read(): Promise<Booking[]>; write(bookings: Booking[]): Promise<void> };
  postBooking: (booking: Booking) => Promise<{ remoteId: string }>;
  cars: { getCarById(id: string): Promise<Car> };
};

/** A repository over the given store and API. The app uses the shared instance below. */
export function createBookingRepository({
  store,
  postBooking,
  cars,
}: Dependencies): BookingRepository {
  let bookings: Booking[] | null = null;
  let sequence = 0;

  const load = async (): Promise<Booking[]> => {
    if (!bookings) bookings = await store.read();
    return bookings;
  };

  const save = async (next: Booking[]) => {
    bookings = next;
    await store.write(next);
  };

  const newId = () => {
    sequence += 1;
    return `booking-${Date.now().toString(36)}-${sequence}`;
  };

  return {
    async getBookings() {
      return (await load()).map((booking) => ({ ...booking }));
    },

    async createBooking(input) {
      // Stamped when the user submits, not when saving happens to finish.
      const createdAt = new Date().toISOString();
      const errors = validateBooking(input, todayIsoDate());
      if (hasErrors(errors)) {
        throw new InvalidBookingError(errors);
      }

      // Cache first, so a car the user has already seen can be booked offline.
      const car = await cars.getCarById(input.carId);
      const booking: Booking = {
        ...input,
        id: newId(),
        // Priced here, from the car's current rate — never trusted from the form.
        totalPrice: calculateTotalPrice(car.pricePerDay, input.startDate, input.endDate),
        createdAt,
        syncStatus: 'pending',
      };
      await save([...(await load()), booking]);
      return { ...booking };
    },

    async syncBooking(id) {
      const existing = (await load()).find((booking) => booking.id === id);
      if (!existing) {
        throw new BookingNotFoundError(id);
      }

      let syncStatus: Booking['syncStatus'];
      try {
        await postBooking(existing);
        syncStatus = 'completed';
      } catch (thrown) {
        syncStatus = isUnreachable(thrown) ? 'pending' : 'failed';
      }

      const updated: Booking = { ...existing, syncStatus };
      await save((await load()).map((booking) => (booking.id === id ? updated : booking)));
      return { ...updated };
    },
  };
}

export const bookingRepository: BookingRepository = createBookingRepository({
  store: bookingStore,
  postBooking: postBookingToApi,
  cars: carRepository,
});
