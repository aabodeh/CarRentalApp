import {
  findBookingByClientId as findBookingByClientIdInApi,
  postBooking as postBookingToApi,
} from '../services/api/bookingApi';
import { ApiStatusError, isUnreachable } from '../services/api/client';
import { bookingStore, type StoredBooking } from '../storage/bookingStore';
import type { Booking, Car } from '../types';
import { calculateTotalPrice } from '../utils/calculateTotalPrice';
import { todayIsoDate } from '../utils/localDate';
import { hasErrors, validateBooking, type BookingErrors } from '../utils/validateBooking';
import { carRepository } from './carRepository';
import { nextRetryAt } from './syncPolicy';

export type { StoredBooking } from '../storage/bookingStore';

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
 * The contract every booking source implements. A booking is saved on the phone first (never
 * needs the network), then sent by the retry queue (src/repositories/syncQueue.ts), one attempt
 * at a time through `syncBooking`. The rules for *when* to attempt are in syncPolicy.ts.
 */
export type BookingRepository = {
  getBookings(): Promise<StoredBooking[]>;
  /** Validates, prices and saves a booking on the phone, `pending`, with no attempts yet. */
  createBooking(input: BookingInput): Promise<StoredBooking>;
  /**
   * One attempt to get the booking onto the server:
   * - accepted (or already there) → `completed`
   * - unreachable / timeout / 5xx → `failed`, next retry scheduled per syncPolicy
   * - refused (4xx / malformed)   → `failed`, `rejected`, no automatic retry
   */
  syncBooking(id: string, now: Date): Promise<StoredBooking>;
  /** The user's "Try again": back to `pending`, attempts reset. The queue then sends it. */
  resetForManualRetry(id: string): Promise<StoredBooking>;
};

type Dependencies = {
  store: { read(): Promise<StoredBooking[]>; write(records: StoredBooking[]): Promise<void> };
  api: {
    postBooking(booking: Booking): Promise<{ remoteId: string }>;
    findBookingByClientId(clientBookingId: string): Promise<{ remoteId: string } | null>;
  };
  cars: { getCarById(id: string): Promise<Car> };
};

/** Worth retrying: we never heard from the server, or the server itself had a problem. */
const isTransient = (error: unknown) =>
  isUnreachable(error) || (error instanceof ApiStatusError && error.status >= 500);

/** A repository over the given store and API. The app uses the shared instance below. */
export function createBookingRepository({ store, api, cars }: Dependencies): BookingRepository {
  let records: StoredBooking[] | null = null;
  let sequence = 0;

  const load = async (): Promise<StoredBooking[]> => {
    if (!records) records = await store.read();
    return records;
  };

  const find = async (id: string): Promise<StoredBooking> => {
    const record = (await load()).find((candidate) => candidate.booking.id === id);
    if (!record) throw new BookingNotFoundError(id);
    return record;
  };

  const replace = async (updated: StoredBooking) => {
    records = (await load()).map((record) =>
      record.booking.id === updated.booking.id ? updated : record
    );
    await store.write(records);
    return updated;
  };

  const newId = () => {
    sequence += 1;
    return `booking-${Date.now().toString(36)}-${sequence}`;
  };

  return {
    async getBookings() {
      return [...(await load())];
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
      const record: StoredBooking = {
        booking: {
          ...input,
          id: newId(),
          // Priced here, from the car's current rate — never trusted from the form.
          totalPrice: calculateTotalPrice(car.pricePerDay, input.startDate, input.endDate),
          createdAt,
          syncStatus: 'pending',
        },
        sync: { attempts: 0, nextRetryAt: null, rejected: false },
      };
      records = [...(await load()), record];
      await store.write(records);
      return record;
    },

    async syncBooking(id, now) {
      const record = await find(id);
      if (record.booking.syncStatus === 'completed') return record;

      const attempts = record.sync.attempts + 1;
      try {
        // Idempotency (K2): a previous attempt may have reached the server even though we never
        // saw the answer. Ask before sending again. A first attempt cannot have been seen yet.
        const alreadyThere = record.sync.attempts > 0 ? await api.findBookingByClientId(id) : null;
        if (!alreadyThere) {
          await api.postBooking(record.booking);
        }
        return await replace({
          booking: { ...record.booking, syncStatus: 'completed' },
          sync: { attempts, nextRetryAt: null, rejected: false },
        });
      } catch (thrown) {
        const retry = isTransient(thrown);
        return replace({
          booking: { ...record.booking, syncStatus: 'failed' },
          sync: {
            attempts,
            nextRetryAt: retry ? nextRetryAt(attempts, now) : null,
            rejected: !retry,
          },
        });
      }
    },

    async resetForManualRetry(id) {
      const record = await find(id);
      return replace({
        booking: { ...record.booking, syncStatus: 'pending' },
        sync: { attempts: 0, nextRetryAt: null, rejected: false },
      });
    },
  };
}

export const bookingRepository: BookingRepository = createBookingRepository({
  store: bookingStore,
  api: { postBooking: postBookingToApi, findBookingByClientId: findBookingByClientIdInApi },
  cars: carRepository,
});
