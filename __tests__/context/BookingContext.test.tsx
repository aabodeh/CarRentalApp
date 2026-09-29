import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { BookingProvider, useBookings } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import {
  createBookingRepository,
  type BookingRepository,
} from '../../src/repositories/bookingRepository';
import { ApiNetworkError } from '../../src/services/api/client';
import type { Booking } from '../../src/types';

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
};

/** A booking repository over an in-memory store and a controllable API. */
function makeRepository(saved: Booking[] = []) {
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
    cars: { getCarById: async (id) => cars.find((car) => car.id === id)! },
  });
  return { repository, postBooking };
}

function setup(repository: BookingRepository) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BookingProvider repository={repository}>{children}</BookingProvider>
  );
  return renderHook(() => useBookings(), { wrapper });
}

describe('BookingContext', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('creates a booking that is pending, then completed once the server accepts it', async () => {
    const { repository } = makeRepository();
    const { result } = setup(repository);

    let created: Booking | undefined;
    await act(async () => {
      created = await result.current.createBooking(input);
    });

    expect(created?.syncStatus).toBe('pending');
    await waitFor(() => expect(result.current.bookings[0].syncStatus).toBe('completed'));
  });

  it('keeps a booking pending when it is made offline', async () => {
    const { repository, postBooking } = makeRepository();
    postBooking.mockRejectedValue(new ApiNetworkError(new Error('offline')));
    const { result } = setup(repository);

    await act(async () => {
      await result.current.createBooking(input);
    });
    await act(async () => {});

    expect(result.current.bookings).toHaveLength(1);
    expect(result.current.bookings[0].syncStatus).toBe('pending');
  });

  it('shows bookings saved in an earlier session', async () => {
    const earlier = makeRepository();
    await earlier.repository.createBooking(input);
    const saved = await earlier.repository.getBookings();

    const { result } = setup(makeRepository(saved).repository);

    await waitFor(() => expect(result.current.bookings).toEqual(saved));
  });

  it('reports submitting while a booking is being created', async () => {
    const { repository } = makeRepository();
    const { result } = setup(repository);

    let pending: Promise<Booking> | undefined;
    act(() => {
      pending = result.current.createBooking(input);
    });

    expect(result.current.creation).toEqual({ status: 'submitting' });
    await act(async () => {
      await pending;
    });
    expect(result.current.creation).toEqual({ status: 'idle' });
  });

  it('creates only one booking when asked twice before the first finishes', async () => {
    const { repository } = makeRepository();
    const createSpy = jest.spyOn(repository, 'createBooking');
    const { result } = setup(repository);

    let first: Promise<Booking> | undefined;
    let second: Promise<Booking> | undefined;
    act(() => {
      first = result.current.createBooking(input);
      second = result.current.createBooking(input);
    });
    await act(async () => {
      await first;
    });

    expect(second).toBe(first);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(result.current.bookings).toHaveLength(1);
  });

  it('exposes the error and adds nothing when creation fails', async () => {
    const { repository } = makeRepository();
    const { result } = setup(repository);

    await act(async () => {
      await expect(result.current.createBooking({ ...input, renterEmail: 'nope' })).rejects.toThrow(
        'The booking is not valid'
      );
    });

    expect(result.current.creation.status).toBe('error');
    expect(result.current.bookings).toEqual([]);
  });

  it('marks a booking as failed, not lost, when syncing it throws unexpectedly', async () => {
    const { repository } = makeRepository();
    jest.spyOn(repository, 'syncBooking').mockRejectedValue(new Error('disk full'));
    const { result } = setup(repository);

    await act(async () => {
      await result.current.createBooking(input);
    });

    await waitFor(() => expect(result.current.bookings[0]?.syncStatus).toBe('failed'));
  });

  it('explains the mistake when used outside its provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useBookings())).toThrow(
      'useBookings must be used inside a <BookingProvider>'
    );
  });
});
