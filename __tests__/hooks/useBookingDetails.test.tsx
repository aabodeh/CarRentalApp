import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import { useBookingDetails } from '../../src/hooks/useBookingDetails';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';
import { storedBooking } from '../helpers/storedBooking';

const flush = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });

async function renderDetails(bookingId: string, fake = makeBookingRepository()) {
  const repo = stubCarRepository();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BookingProvider repository={fake.repository}>{children}</BookingProvider>
  );
  const rendered = renderHook(() => useBookingDetails(bookingId), { wrapper });
  // The first read from the phone settles inside act, even when it fails.
  await flush();
  return { ...rendered, repo, fake };
}

describe('useBookingDetails', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(async () => {
    // Async flush: a pending retry timer starts an async send, which must finish inside act.
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
    setOnline();
  });

  it('is loading while the bookings are read from the phone', async () => {
    const fake = makeBookingRepository();
    jest.spyOn(fake.repository, 'getBookings').mockReturnValue(new Promise(() => {}));

    const { result } = await renderDetails('booking-1', fake);

    expect(result.current).toEqual({ status: 'loading' });
  });

  it('reports an error with retry when the bookings cannot be read, and reads them again', async () => {
    const fake = makeBookingRepository([storedBooking({ syncStatus: 'completed' })]);
    jest.spyOn(fake.repository, 'getBookings').mockRejectedValueOnce(new Error('disk'));
    const { result, repo } = await renderDetails('booking-1', fake);
    repo.emitCars(cars);
    await flush();

    const state = result.current;
    if (state.status !== 'error') throw new Error('expected error state');
    // Async act: retry starts a read from the phone, which resolves after the call returns.
    await act(async () => {
      state.retry();
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(result.current.status).toBe('ready');
  });

  it('is ready with the booking and its car name', async () => {
    setOffline();
    const record = storedBooking({ carId: 'car-05' });
    const { result, repo } = await renderDetails('booking-1', makeBookingRepository([record]));
    repo.emitCars(cars);
    await flush();

    expect(result.current).toEqual({ status: 'ready', record, carName: 'Tesla Model 3' });
  });

  it('names the car by its id when the car list is not known on this phone', async () => {
    setOffline();
    const { result, repo } = await renderDetails(
      'booking-1',
      makeBookingRepository([storedBooking({ carId: 'car-99' })])
    );
    repo.emitError(new Error('offline'));
    await flush();

    expect(result.current.status === 'ready' && result.current.carName).toBe('Car car-99');
  });

  it('reports not-found when the booking is not on this phone', async () => {
    const { result, repo } = await renderDetails('booking-404');
    repo.emitCars(cars);
    await flush();

    expect(result.current).toEqual({ status: 'not-found' });
  });

  it('follows the booking when its status changes', async () => {
    setOffline();
    const { result, rerender, repo } = await renderDetails(
      'booking-1',
      makeBookingRepository([storedBooking({ syncStatus: 'pending' })])
    );
    repo.emitCars(cars);
    await flush();
    const status = () =>
      result.current.status === 'ready' && result.current.record.booking.syncStatus;
    expect(status()).toBe('pending');

    setOnline();
    rerender({});
    await flush();

    expect(status()).toBe('completed');
  });
});
