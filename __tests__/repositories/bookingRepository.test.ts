import { cars } from '../../src/data/dummy/cars';
import {
  BookingNotFoundError,
  InvalidBookingError,
  createBookingRepository,
} from '../../src/repositories/bookingRepository';
import { CarNotFoundError } from '../../src/repositories/carRepository';
import {
  ApiNetworkError,
  ApiPayloadError,
  ApiStatusError,
  ApiTimeoutError,
} from '../../src/services/api/client';
import type { StoredBooking } from '../../src/storage/bookingStore';
import type { Booking } from '../../src/types';

const tesla = cars.find((car) => car.id === 'car-05')!;
const NOW = new Date(2026, 8, 28, 10, 0);
const at = (ms: number) => new Date(NOW.getTime() + ms);

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-04',
};

function setup(saved: StoredBooking[] = []) {
  let stored = saved;
  const store = {
    read: jest.fn(async () => stored),
    write: jest.fn(async (next: StoredBooking[]) => {
      stored = next;
    }),
  };
  const api = {
    postBooking: jest.fn<Promise<{ remoteId: string }>, [Booking]>(),
    findBookingByClientId: jest.fn<Promise<{ remoteId: string } | null>, [string]>(),
  };
  api.postBooking.mockResolvedValue({ remoteId: '1' });
  api.findBookingByClientId.mockResolvedValue(null);
  const carSource = {
    getCarById: jest.fn(async (id: string) => {
      const car = cars.find((candidate) => candidate.id === id);
      if (!car) throw new CarNotFoundError(id);
      return car;
    }),
  };
  const repository = createBookingRepository({ store, api, cars: carSource });
  return { repository, store, api, stored: () => stored };
}

describe('bookingRepository', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves a new booking on the phone as pending, priced from the car, before any network', async () => {
    const { repository, stored, api } = setup();

    const record = await repository.createBooking(input);

    expect(record.booking).toMatchObject({
      ...input,
      syncStatus: 'pending',
      totalPrice: tesla.pricePerDay * 3,
    });
    expect(record.sync).toEqual({ attempts: 0, nextRetryAt: null, rejected: false });
    expect(stored()).toEqual([record]);
    expect(api.postBooking).not.toHaveBeenCalled();
  });

  it('keeps a pending booking across a restart', async () => {
    const first = setup();
    const record = await first.repository.createBooking(input);

    const restarted = setup(first.stored());

    await expect(restarted.repository.getBookings()).resolves.toEqual([record]);
  });

  it('marks a booking completed when the server accepts it', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);

    const synced = await repository.syncBooking(booking.id, NOW);

    expect(api.postBooking).toHaveBeenCalledWith(booking);
    expect(synced.booking.syncStatus).toBe('completed');
    expect(synced.sync).toEqual({ attempts: 1, nextRetryAt: null, rejected: false });
  });

  it('does not ask the server first on a first attempt: it cannot have the booking yet', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);

    await repository.syncBooking(booking.id, NOW);

    expect(api.findBookingByClientId).not.toHaveBeenCalled();
  });

  it.each([
    ['the network failed', new ApiNetworkError(new Error('x'))],
    ['it timed out', new ApiTimeoutError()],
    ['the server had an error', new ApiStatusError(503)],
  ])('marks a booking failed and schedules a retry when %s', async (_label, error) => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    api.postBooking.mockRejectedValue(error);

    const result = await repository.syncBooking(booking.id, NOW);

    expect(result.booking.syncStatus).toBe('failed');
    expect(result.sync).toEqual({
      attempts: 1,
      nextRetryAt: at(2_000).toISOString(),
      rejected: false,
    });
  });

  it.each([
    ['refused it', new ApiStatusError(422)],
    ['sent a malformed reply', new ApiPayloadError('/bookings')],
  ])('does not schedule a retry when the server %s', async (_label, error) => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    api.postBooking.mockRejectedValue(error);

    const result = await repository.syncBooking(booking.id, NOW);

    expect(result.booking.syncStatus).toBe('failed');
    expect(result.sync).toMatchObject({ attempts: 1, nextRetryAt: null, rejected: true });
  });

  it('does not create a duplicate when a retry finds the server already has the booking', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    api.postBooking.mockRejectedValueOnce(new ApiTimeoutError());
    await repository.syncBooking(booking.id, NOW);
    // The timed-out request had in fact been saved by the server.
    api.findBookingByClientId.mockResolvedValue({ remoteId: '17' });

    const result = await repository.syncBooking(booking.id, at(2_000));

    expect(api.findBookingByClientId).toHaveBeenCalledWith(booking.id);
    expect(api.postBooking).toHaveBeenCalledTimes(1);
    expect(result.booking.syncStatus).toBe('completed');
  });

  it('sends the booking on a retry when the server does not have it', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    api.postBooking.mockRejectedValueOnce(new ApiNetworkError(new Error('x')));
    await repository.syncBooking(booking.id, NOW);

    const result = await repository.syncBooking(booking.id, at(2_000));

    expect(api.postBooking).toHaveBeenCalledTimes(2);
    expect(result.booking.syncStatus).toBe('completed');
    expect(result.sync.attempts).toBe(2);
  });

  it('stops scheduling retries after the fourth attempt', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    api.postBooking.mockRejectedValue(new ApiStatusError(503));

    let result = await repository.syncBooking(booking.id, NOW);
    for (let i = 0; i < 3; i += 1) result = await repository.syncBooking(booking.id, NOW);

    expect(result.sync).toEqual({ attempts: 4, nextRetryAt: null, rejected: false });
  });

  it('starts over when the user retries by hand', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    api.postBooking.mockRejectedValueOnce(new ApiStatusError(422));
    await repository.syncBooking(booking.id, NOW);

    const reset = await repository.resetForManualRetry(booking.id);

    expect(reset.booking.syncStatus).toBe('pending');
    expect(reset.sync).toEqual({ attempts: 0, nextRetryAt: null, rejected: false });
  });

  it('leaves a completed booking alone', async () => {
    const { repository, api } = setup();
    const { booking } = await repository.createBooking(input);
    await repository.syncBooking(booking.id, NOW);

    await repository.syncBooking(booking.id, NOW);

    expect(api.postBooking).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid input, re-checking it the way a server would', async () => {
    const { repository, store } = setup();

    await expect(
      repository.createBooking({ ...input, renterEmail: 'not-an-email' })
    ).rejects.toThrow(InvalidBookingError);
    expect(store.write).not.toHaveBeenCalled();
  });

  it('rejects a booking for a car that does not exist', async () => {
    const { repository } = setup();

    await expect(repository.createBooking({ ...input, carId: 'car-404' })).rejects.toThrow(
      CarNotFoundError
    );
  });

  it('rejects syncing a booking that does not exist', async () => {
    const { repository } = setup();

    await expect(repository.syncBooking('booking-404', NOW)).rejects.toThrow(BookingNotFoundError);
  });
});
