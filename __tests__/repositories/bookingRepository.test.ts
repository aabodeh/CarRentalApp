import { cars } from '../../src/data/dummy/cars';
import {
  BookingNotFoundError,
  InvalidBookingError,
  createBookingRepository,
} from '../../src/repositories/bookingRepository';
import { CarNotFoundError } from '../../src/repositories/carRepository';
import { ApiNetworkError, ApiStatusError, ApiTimeoutError } from '../../src/services/api/client';
import type { Booking } from '../../src/types';

const tesla = cars.find((car) => car.id === 'car-05')!;

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-04',
};

function setup(saved: Booking[] = []) {
  let stored = saved;
  const store = {
    read: jest.fn(async () => stored),
    write: jest.fn(async (next: Booking[]) => {
      stored = next;
    }),
  };
  const postBooking = jest.fn<Promise<{ remoteId: string }>, [Booking]>();
  const carSource = {
    getCarById: jest.fn(async (id: string) => {
      const car = cars.find((candidate) => candidate.id === id);
      if (!car) throw new CarNotFoundError(id);
      return car;
    }),
  };
  const repository = createBookingRepository({ store, postBooking, cars: carSource });
  return { repository, store, postBooking, stored: () => stored };
}

describe('bookingRepository', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a pending booking, priced from the car, and saves it on the phone', async () => {
    const { repository, stored } = setup();

    const booking = await repository.createBooking(input);

    expect(booking).toMatchObject({
      ...input,
      syncStatus: 'pending',
      totalPrice: tesla.pricePerDay * 3,
    });
    expect(booking.createdAt).toBe(new Date(2026, 8, 28, 10, 0).toISOString());
    expect(stored()).toEqual([booking]);
  });

  it('keeps bookings across a restart', async () => {
    const first = setup();
    const booking = await first.repository.createBooking(input);

    const restarted = setup(first.stored());

    await expect(restarted.repository.getBookings()).resolves.toEqual([booking]);
  });

  it('gives every booking a unique id', async () => {
    const { repository } = setup();

    const a = await repository.createBooking(input);
    const b = await repository.createBooking(input);

    expect(a.id).not.toBe(b.id);
  });

  it('marks a booking completed once the server has accepted it', async () => {
    const { repository, postBooking, stored } = setup();
    const booking = await repository.createBooking(input);
    postBooking.mockResolvedValue({ remoteId: '17' });

    const synced = await repository.syncBooking(booking.id);

    expect(postBooking).toHaveBeenCalledWith(booking);
    expect(synced.syncStatus).toBe('completed');
    expect(stored()[0].syncStatus).toBe('completed');
  });

  it.each([
    ['offline', new ApiNetworkError(new Error('Network request failed'))],
    ['timed out', new ApiTimeoutError()],
  ])('leaves a booking pending, to sync later, when the server is %s', async (_label, error) => {
    const { repository, postBooking, stored } = setup();
    const booking = await repository.createBooking(input);
    postBooking.mockRejectedValue(error);

    const result = await repository.syncBooking(booking.id);

    expect(result.syncStatus).toBe('pending');
    expect(stored()[0].syncStatus).toBe('pending');
  });

  it('marks a booking failed when the server rejects it', async () => {
    const { repository, postBooking } = setup();
    const booking = await repository.createBooking(input);
    postBooking.mockRejectedValue(new ApiStatusError(422));

    await expect(repository.syncBooking(booking.id)).resolves.toMatchObject({
      syncStatus: 'failed',
    });
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

    await expect(repository.syncBooking('booking-404')).rejects.toThrow(BookingNotFoundError);
  });
});
