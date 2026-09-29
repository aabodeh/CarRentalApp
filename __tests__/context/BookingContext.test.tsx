import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { BookingProvider, useBookings } from '../../src/context/BookingContext';
import { ApiStatusError } from '../../src/services/api/client';
import type { StoredBooking } from '../../src/storage/bookingStore';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { setOffline, setOnline } from '../helpers/network';

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
};

function setup(fake = makeBookingRepository()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BookingProvider repository={fake.repository}>{children}</BookingProvider>
  );
  return { ...fake, ...renderHook(() => useBookings(), { wrapper }) };
}

/** Lets the queue's work (and its timers) run inside act. */
const settle = (ms = 0) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

describe('BookingContext', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
    setOnline();
  });

  it('saves a booking as pending, then sends it and shows it confirmed', async () => {
    const { result } = setup();
    await settle();

    let created: StoredBooking | undefined;
    await act(async () => {
      created = await result.current.createBooking(input);
    });
    expect(created?.booking.syncStatus).toBe('pending');

    await settle();
    expect(result.current.records[0].booking.syncStatus).toBe('completed');
  });

  it('keeps a booking made offline pending, and sends it when the connection returns', async () => {
    setOffline();
    const fake = makeBookingRepository();
    const { result, rerender } = setup(fake);
    await settle();
    await act(async () => {
      await result.current.createBooking(input);
    });
    await settle(60_000);
    expect(fake.postBooking).not.toHaveBeenCalled();
    expect(result.current.records[0].booking.syncStatus).toBe('pending');

    setOnline();
    rerender({});
    await settle();

    expect(fake.postBooking).toHaveBeenCalledTimes(1);
    expect(result.current.records[0].booking.syncStatus).toBe('completed');
  });

  it('retries by itself after a failure, and tells the user once it succeeds', async () => {
    const fake = makeBookingRepository();
    fake.postBooking.mockRejectedValueOnce(new ApiStatusError(503));
    const { result } = setup(fake);
    await settle();
    await act(async () => {
      await result.current.createBooking(input);
    });
    await settle();
    expect(result.current.records[0].booking.syncStatus).toBe('failed');

    await settle(2_000);

    expect(result.current.records[0].booking.syncStatus).toBe('completed');
    expect(result.current.notice?.booking.id).toBe(result.current.records[0].booking.id);
  });

  it('sends bookings left unsent by a previous session as soon as it starts', async () => {
    const earlier = makeBookingRepository();
    await earlier.repository.createBooking(input);
    const fake = makeBookingRepository(earlier.stored());

    const { result } = setup(fake);
    await settle();

    expect(fake.postBooking).toHaveBeenCalledTimes(1);
    expect(result.current.records[0].booking.syncStatus).toBe('completed');
  });

  it('tries again when the app comes back to the foreground', async () => {
    let onChange: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onChange = listener as (state: AppStateStatus) => void;
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    const fake = makeBookingRepository();
    fake.postBooking.mockRejectedValueOnce(new ApiStatusError(503));
    const { result } = setup(fake);
    await settle();
    await act(async () => {
      await result.current.createBooking(input);
    });
    await settle(500);
    expect(fake.postBooking).toHaveBeenCalledTimes(1);

    act(() => onChange?.('active'));
    await settle();

    expect(fake.postBooking).toHaveBeenCalledTimes(2);
  });

  it('lets the user retry a booking the server refused', async () => {
    const fake = makeBookingRepository();
    fake.postBooking.mockRejectedValueOnce(new ApiStatusError(422));
    const { result } = setup(fake);
    await settle();
    await act(async () => {
      await result.current.createBooking(input);
    });
    await settle();
    expect(result.current.records[0].sync.rejected).toBe(true);

    act(() => result.current.retryBooking(result.current.records[0].booking.id));
    await settle();

    expect(result.current.records[0].booking.syncStatus).toBe('completed');
  });

  it('creates only one booking when asked twice before the first finishes', async () => {
    const fake = makeBookingRepository();
    const createSpy = jest.spyOn(fake.repository, 'createBooking');
    const { result } = setup(fake);
    await settle();

    let first: Promise<StoredBooking> | undefined;
    let second: Promise<StoredBooking> | undefined;
    act(() => {
      first = result.current.createBooking(input);
      second = result.current.createBooking(input);
    });
    await act(async () => {
      await first;
    });

    expect(second).toBe(first);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(result.current.records).toHaveLength(1);
  });

  it('reports a failed load, and loads again on request', async () => {
    const fake = makeBookingRepository();
    jest.spyOn(fake.repository, 'getBookings').mockRejectedValueOnce(new Error('disk'));
    const { result } = setup(fake);
    await settle();
    expect(result.current.load.status).toBe('error');

    act(() => result.current.reload());
    await settle();

    expect(result.current.load).toEqual({ status: 'ready' });
  });

  it('exposes the error and adds nothing when creation fails', async () => {
    const { result } = setup();
    await settle();

    await act(async () => {
      await expect(result.current.createBooking({ ...input, renterEmail: 'nope' })).rejects.toThrow(
        'The booking is not valid'
      );
    });

    expect(result.current.creation.status).toBe('error');
    expect(result.current.records).toEqual([]);
  });

  it('explains the mistake when used outside its provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useBookings())).toThrow(
      'useBookings must be used inside a <BookingProvider>'
    );
  });
});
