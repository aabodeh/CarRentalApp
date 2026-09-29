import {
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
  isAutoRetryable,
  isDue,
  needsManualRetry,
  nextRetryAt,
} from '../../src/repositories/syncPolicy';
import type { StoredBooking } from '../../src/storage/bookingStore';

const NOW = new Date('2026-09-29T10:00:00.000Z');

const record = (
  syncStatus: StoredBooking['booking']['syncStatus'],
  sync: Partial<StoredBooking['sync']> = {}
): StoredBooking => ({
  booking: {
    id: 'b1',
    carId: '5',
    renterName: 'Mette',
    renterEmail: 'mette@example.dk',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    totalPrice: 1498,
    createdAt: '2026-09-29T09:00:00.000Z',
    syncStatus,
  },
  sync: { attempts: 0, nextRetryAt: null, rejected: false, ...sync },
});

describe('syncPolicy', () => {
  it('waits 2 s, 8 s, then 30 s between attempts, and allows 4 attempts in total', () => {
    expect(RETRY_DELAYS_MS).toEqual([2_000, 8_000, 30_000]);
    expect(MAX_ATTEMPTS).toBe(4);
    expect(nextRetryAt(1, NOW)).toBe('2026-09-29T10:00:02.000Z');
    expect(nextRetryAt(2, NOW)).toBe('2026-09-29T10:00:08.000Z');
    expect(nextRetryAt(3, NOW)).toBe('2026-09-29T10:00:30.000Z');
  });

  it('schedules nothing after the last attempt: the user retries by hand', () => {
    expect(nextRetryAt(4, NOW)).toBeNull();
  });

  it('treats a booking never sent as due at once', () => {
    expect(isDue(record('pending'), NOW)).toBe(true);
  });

  it('treats a failed booking as due only once its retry time has come', () => {
    const waiting = record('failed', { attempts: 1, nextRetryAt: '2026-09-29T10:00:02.000Z' });

    expect(isDue(waiting, NOW)).toBe(false);
    expect(isDue(waiting, new Date('2026-09-29T10:00:02.000Z'))).toBe(true);
    expect(isAutoRetryable(waiting)).toBe(true);
  });

  it('never retries a completed booking', () => {
    expect(isDue(record('completed', { attempts: 1 }), NOW)).toBe(false);
    expect(isAutoRetryable(record('completed', { attempts: 1 }))).toBe(false);
  });

  it('does not retry by itself once attempts are used up, and asks for a manual retry', () => {
    const exhausted = record('failed', { attempts: 4, nextRetryAt: null });

    expect(isDue(exhausted, NOW)).toBe(false);
    expect(isAutoRetryable(exhausted)).toBe(false);
    expect(needsManualRetry(exhausted)).toBe(true);
  });

  it('does not retry by itself a booking the server rejected', () => {
    const rejected = record('failed', { attempts: 1, rejected: true });

    expect(isAutoRetryable(rejected)).toBe(false);
    expect(needsManualRetry(rejected)).toBe(true);
  });

  it('does not ask for a manual retry while an automatic one is still coming', () => {
    expect(
      needsManualRetry(record('failed', { attempts: 1, nextRetryAt: '2026-09-29T10:00:02.000Z' }))
    ).toBe(false);
    expect(needsManualRetry(record('pending'))).toBe(false);
  });
});
