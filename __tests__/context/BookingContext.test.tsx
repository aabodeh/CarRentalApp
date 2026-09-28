import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { BookingProvider, useBookings } from '../../src/context/BookingContext';
import {
  createInMemoryBookingRepository,
  type BookingRepository,
} from '../../src/repositories/bookingRepository';
import type { Booking } from '../../src/types';

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
};

function setup(repository: BookingRepository = createInMemoryBookingRepository()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BookingProvider repository={repository}>{children}</BookingProvider>
  );
  return { repository, ...renderHook(() => useBookings(), { wrapper }) };
}

describe('BookingContext', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('creates a booking that is pending, then completed once it has synced', async () => {
    const { result } = setup();

    let created: Booking | undefined;
    await act(async () => {
      const promise = result.current.createBooking(input);
      await jest.advanceTimersByTimeAsync(400);
      created = await promise;
    });

    expect(created?.syncStatus).toBe('pending');
    expect(result.current.bookings).toEqual([created]);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });

    expect(result.current.bookings[0].syncStatus).toBe('completed');
  });

  it('reports submitting while a booking is being created', async () => {
    const { result } = setup();

    act(() => {
      void result.current.createBooking(input);
    });

    expect(result.current.creation).toEqual({ status: 'submitting' });
    await act(async () => {
      await jest.runAllTimersAsync();
    });
    expect(result.current.creation).toEqual({ status: 'idle' });
  });

  it('creates only one booking when asked twice before the first finishes', async () => {
    const { result, repository } = setup();
    const createSpy = jest.spyOn(repository, 'createBooking');

    let first: Promise<Booking> | undefined;
    let second: Promise<Booking> | undefined;
    act(() => {
      first = result.current.createBooking(input);
      second = result.current.createBooking(input);
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(second).toBe(first);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(result.current.bookings).toHaveLength(1);
  });

  it('exposes the error and adds nothing when creation fails', async () => {
    const { result } = setup();

    await act(async () => {
      const promise = result.current.createBooking({ ...input, renterEmail: 'nope' });
      // Attach the expectation before advancing time, or the rejection counts as unhandled.
      const assertion = expect(promise).rejects.toThrow('The booking is not valid');
      await jest.runAllTimersAsync();
      await assertion;
    });

    expect(result.current.creation.status).toBe('error');
    expect(result.current.bookings).toEqual([]);
  });

  it('marks a booking as failed, not lost, when syncing it fails', async () => {
    const repository = createInMemoryBookingRepository();
    jest.spyOn(repository, 'syncBooking').mockRejectedValue(new Error('offline'));
    const { result } = setup(repository);

    await act(async () => {
      void result.current.createBooking(input);
      await jest.runAllTimersAsync();
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
