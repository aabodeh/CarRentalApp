import { cars } from '../../src/data/dummy/cars';
import {
  BookingNotFoundError,
  InvalidBookingError,
  createInMemoryBookingRepository,
  type BookingRepository,
} from '../../src/repositories/bookingRepository';
import { CarNotFoundError, SIMULATED_LATENCY_MS } from '../../src/repositories/carRepository';

const tesla = cars.find((car) => car.id === 'car-05')!;

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-04',
};

/** Runs a repository call to completion under fake timers. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error })
  );
  await jest.runAllTimersAsync();
  const outcome = await result;
  if (!outcome.ok) throw outcome.error;
  return outcome.value;
}

describe('bookingRepository', () => {
  let bookingRepository: BookingRepository;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
    bookingRepository = createInMemoryBookingRepository();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a booking with pending sync status', async () => {
    const booking = await settle(bookingRepository.createBooking(input));

    expect(booking).toMatchObject({ ...input, syncStatus: 'pending' });
    expect(booking.id).toEqual(expect.any(String));
    expect(booking.createdAt).toBe(new Date(2026, 8, 28, 10, 0).toISOString());
  });

  it('computes the total price itself, from the car and the dates', async () => {
    const booking = await settle(bookingRepository.createBooking(input));

    expect(booking.totalPrice).toBe(tesla.pricePerDay * 3);
  });

  it('gives every booking a unique id', async () => {
    const first = await settle(bookingRepository.createBooking(input));
    const second = await settle(bookingRepository.createBooking(input));

    expect(first.id).not.toBe(second.id);
  });

  it('settles a pending booking to completed when it syncs', async () => {
    const booking = await settle(bookingRepository.createBooking(input));

    const synced = await settle(bookingRepository.syncBooking(booking.id));

    expect(synced).toEqual({ ...booking, syncStatus: 'completed' });
    expect(await settle(bookingRepository.getBookings())).toEqual([synced]);
  });

  it('answers after the simulated latency, like the car repository', async () => {
    const onResolve = jest.fn();
    bookingRepository.createBooking(input).then(onResolve);

    await jest.advanceTimersByTimeAsync(SIMULATED_LATENCY_MS - 1);
    expect(onResolve).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(onResolve).toHaveBeenCalled();
  });

  it('rejects invalid input, re-checking it the way a server would', async () => {
    await expect(
      settle(bookingRepository.createBooking({ ...input, renterEmail: 'not-an-email' }))
    ).rejects.toThrow(InvalidBookingError);
  });

  it('rejects a booking that starts in the past', async () => {
    await expect(
      settle(bookingRepository.createBooking({ ...input, startDate: '2026-09-01' }))
    ).rejects.toMatchObject({ errors: { startDate: "Pick-up can't be in the past." } });
  });

  it('rejects a booking for a car that does not exist', async () => {
    await expect(
      settle(bookingRepository.createBooking({ ...input, carId: 'car-404' }))
    ).rejects.toThrow(CarNotFoundError);
  });

  it('rejects syncing a booking that does not exist', async () => {
    await expect(settle(bookingRepository.syncBooking('booking-404'))).rejects.toThrow(
      BookingNotFoundError
    );
  });
});
