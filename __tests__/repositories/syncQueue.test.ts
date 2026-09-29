import { cars } from '../../src/data/dummy/cars';
import { createBookingRepository } from '../../src/repositories/bookingRepository';
import { needsManualRetry } from '../../src/repositories/syncPolicy';
import { createSyncQueue } from '../../src/repositories/syncQueue';
import { ApiNetworkError, ApiStatusError } from '../../src/services/api/client';
import type { StoredBooking } from '../../src/storage/bookingStore';
import type { Booking } from '../../src/types';

const START = new Date(2026, 8, 28, 10, 0, 0);

const input = {
  carId: 'car-05',
  renterName: 'Mette Frederiksen',
  renterEmail: 'mette@example.dk',
  startDate: '2026-10-01',
  endDate: '2026-10-04',
};

function setup(saved: StoredBooking[] = []) {
  let stored = saved;
  let online = true;
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
    cars: { getCarById: async (id) => cars.find((car) => car.id === id)! },
  });
  const settled: StoredBooking[] = [];
  const queue = createSyncQueue({
    repository,
    isOnline: () => online,
    onSettled: (record) => settled.push(record),
  });
  return {
    repository,
    queue,
    postBooking,
    findBookingByClientId,
    settled,
    stored: () => stored,
    setOnline: (value: boolean) => {
      online = value;
    },
  };
}

/** Advances fake time and lets every resulting attempt finish. */
const advance = (ms: number) => jest.advanceTimersByTimeAsync(ms);
/** Times (ms since START) at which the API was called, for the backoff-spacing test. */
let callAt: number[] = [];

describe('syncQueue (K2)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: START });
    callAt = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends a new booking straight away when online', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);

    await queue.run();

    expect(postBooking).toHaveBeenCalledTimes(1);
    expect((await repository.getBookings())[0].booking.syncStatus).toBe('completed');
    queue.stop();
  });

  it('retries a failed booking by itself after the backoff delay', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    postBooking.mockRejectedValueOnce(new ApiStatusError(503));

    await queue.run();
    expect(postBooking).toHaveBeenCalledTimes(1);

    await advance(1_999);
    expect(postBooking).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(postBooking).toHaveBeenCalledTimes(2);
    expect((await repository.getBookings())[0].booking.syncStatus).toBe('completed');
    queue.stop();
  });

  it('waits 2 s, then 8 s, then 30 s between attempts', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    postBooking.mockImplementation(async () => {
      callAt.push(Date.now() - START.getTime());
      throw new ApiStatusError(503);
    });

    await queue.run();
    await advance(60_000);

    expect(callAt).toEqual([0, 2_000, 10_000, 40_000]);
    queue.stop();
  });

  it('stops after four attempts and waits for the user to retry by hand', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    postBooking.mockRejectedValue(new ApiStatusError(503));

    await queue.run();
    await advance(10 * 60_000);

    expect(postBooking).toHaveBeenCalledTimes(4);
    const [record] = await repository.getBookings();
    expect(record.booking.syncStatus).toBe('failed');
    expect(needsManualRetry(record)).toBe(true);
    queue.stop();
  });

  it('sends again from the start when the user retries by hand', async () => {
    const { repository, queue, postBooking } = setup();
    const { booking } = await repository.createBooking(input);
    postBooking.mockRejectedValueOnce(new ApiStatusError(422));
    await queue.run();
    expect((await repository.getBookings())[0].sync.rejected).toBe(true);

    await queue.retryNow(booking.id);

    expect(postBooking).toHaveBeenCalledTimes(2);
    expect((await repository.getBookings())[0].booking.syncStatus).toBe('completed');
    queue.stop();
  });

  it('does not retry a booking the server refused', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    postBooking.mockRejectedValue(new ApiStatusError(422));

    await queue.run();
    await advance(10 * 60_000);

    expect(postBooking).toHaveBeenCalledTimes(1);
    queue.stop();
  });

  it('reports a booking that succeeded after a failed attempt, so the user can be told', async () => {
    const { repository, queue, postBooking, settled } = setup();
    await repository.createBooking(input);
    postBooking.mockRejectedValueOnce(new ApiNetworkError(new Error('x')));

    await queue.run();
    await advance(2_000);

    const completed = settled.find((record) => record.booking.syncStatus === 'completed');
    expect(completed?.sync.attempts).toBe(2);
    queue.stop();
  });

  it('does not use up attempts while offline, and sends when the connection returns', async () => {
    const { repository, queue, postBooking, setOnline } = setup();
    await repository.createBooking(input);
    setOnline(false);

    await queue.run();
    await advance(10 * 60_000);
    expect(postBooking).not.toHaveBeenCalled();
    expect((await repository.getBookings())[0].booking.syncStatus).toBe('pending');

    setOnline(true);
    await queue.run({ ignoreSchedule: true });

    expect(postBooking).toHaveBeenCalledTimes(1);
    expect((await repository.getBookings())[0].booking.syncStatus).toBe('completed');
    queue.stop();
  });

  it('retries a waiting booking at once when triggered, without waiting out the backoff', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    postBooking.mockRejectedValueOnce(new ApiStatusError(503));
    await queue.run();

    // e.g. the app came back to the foreground 500 ms later
    await advance(500);
    await queue.run({ ignoreSchedule: true });

    expect(postBooking).toHaveBeenCalledTimes(2);
    queue.stop();
  });

  it('does not create a duplicate when a retry finds the booking already on the server', async () => {
    const { repository, queue, postBooking, findBookingByClientId } = setup();
    const { booking } = await repository.createBooking(input);
    postBooking.mockRejectedValueOnce(new ApiNetworkError(new Error('timeout after saving')));
    findBookingByClientId.mockResolvedValue({ remoteId: '17' });

    await queue.run();
    await advance(2_000);

    expect(findBookingByClientId).toHaveBeenCalledWith(booking.id);
    expect(postBooking).toHaveBeenCalledTimes(1);
    expect((await repository.getBookings())[0].booking.syncStatus).toBe('completed');
    queue.stop();
  });

  it('sends a booking left pending by a previous session', async () => {
    const before = setup();
    await before.repository.createBooking(input);
    before.setOnline(false);
    await before.queue.run();
    before.queue.stop();

    const restarted = setup(before.stored());
    await restarted.queue.run();

    expect(restarted.postBooking).toHaveBeenCalledTimes(1);
    expect((await restarted.repository.getBookings())[0].booking.syncStatus).toBe('completed');
    restarted.queue.stop();
  });

  it('never sends the same booking twice at the same time', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    let finish!: () => void;
    postBooking.mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve({ remoteId: '1' });
      })
    );

    const first = queue.run({ ignoreSchedule: true });
    const second = queue.run({ ignoreSchedule: true });
    await advance(0);
    finish();
    await Promise.all([first, second]);

    expect(postBooking).toHaveBeenCalledTimes(1);
    queue.stop();
  });

  it('stops scheduling once stopped', async () => {
    const { repository, queue, postBooking } = setup();
    await repository.createBooking(input);
    postBooking.mockRejectedValue(new ApiStatusError(503));
    await queue.run();

    queue.stop();
    await advance(10 * 60_000);

    expect(postBooking).toHaveBeenCalledTimes(1);
  });
});
