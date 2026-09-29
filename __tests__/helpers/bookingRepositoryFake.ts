import { cars } from '../../src/data/dummy/cars';
import { createBookingRepository } from '../../src/repositories/bookingRepository';
import type { Booking } from '../../src/types';

/**
 * A real booking repository over an in-memory store, with the API call under the test's control.
 * `reply` decides what "the server" does: accept (default), fail to connect, or never answer.
 */
export function makeBookingRepository(saved: Booking[] = []) {
  let stored = saved;
  const postBooking = jest.fn<Promise<{ remoteId: string }>, [Booking]>();
  postBooking.mockResolvedValue({ remoteId: '1' });

  const repository = createBookingRepository({
    store: {
      read: async () => stored,
      write: async (next) => {
        stored = next;
      },
    },
    postBooking,
    cars: {
      getCarById: async (id) => {
        const car = cars.find((candidate) => candidate.id === id);
        if (!car) throw new Error(`no car ${id}`);
        return car;
      },
    },
  });

  return { repository, postBooking, stored: () => stored };
}
