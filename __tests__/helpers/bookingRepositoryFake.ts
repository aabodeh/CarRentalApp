import { cars } from '../../src/data/dummy/cars';
import { createBookingRepository } from '../../src/repositories/bookingRepository';
import type { StoredBooking } from '../../src/storage/bookingStore';
import type { Booking } from '../../src/types';

/**
 * A real booking repository over an in-memory store, with the API under the test's control.
 * By default the server accepts every booking and has none already.
 */
export function makeBookingRepository(saved: StoredBooking[] = []) {
  let stored = saved;
  const postBooking = jest.fn<Promise<{ remoteId: string }>, [Booking]>();
  postBooking.mockResolvedValue({ remoteId: '1' });
  const findBookingByClientId = jest.fn<Promise<{ remoteId: string } | null>, [string]>();
  findBookingByClientId.mockResolvedValue(null);

  const repository = createBookingRepository({
    store: {
      read: async () => stored,
      write: async (next) => {
        stored = next;
      },
    },
    api: { postBooking, findBookingByClientId },
    cars: {
      getCarById: async (id) => {
        const car = cars.find((candidate) => candidate.id === id);
        if (!car) throw new Error(`no car ${id}`);
        return car;
      },
    },
  });

  return { repository, postBooking, findBookingByClientId, stored: () => stored };
}
