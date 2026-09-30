import type { StoredBooking } from '../storage/bookingStore';
import type { BookingRepository } from './bookingRepository';
import { isAutoRetryable, isDue } from './syncPolicy';

export type SyncQueue = {
  /**
   * Sends every booking the policy allows. By default only those whose retry time has come;
   * with `ignoreSchedule`, every automatically-retryable one at once — used when something
   * suggests it is worth trying now (network back, app foregrounded, app start).
   */
  run(options?: { ignoreSchedule?: boolean }): Promise<void>;
  /** The user's "Try again" on one booking: reset it and send it now. */
  retryNow(id: string): Promise<void>;
  /** Cancel the pending timer. Used when the app's provider unmounts. */
  stop(): void;
};

type Dependencies = {
  repository: Pick<BookingRepository, 'getBookings' | 'syncBooking' | 'resetForManualRetry'>;
  /** No attempts are made while offline — they would fail at once and use up retries. */
  isOnline: () => boolean;
  /** Called with every booking whose state changed, so the UI can follow along (K3). */
  onSettled: (record: StoredBooking) => void;
  now?: () => Date;
};

/**
 * K2 — the retry queue. It is not a list of its own: it is derived from the stored bookings on
 * every run (see syncPolicy.ts for the rules), so there is one source of truth.
 *
 * One run at a time, bookings one after another: the same booking is never sent twice at once.
 * A run requested while one is going is merged into a follow-up run. One timer, set for the
 * earliest scheduled retry.
 */
export function createSyncQueue({
  repository,
  isOnline,
  onSettled,
  now = () => new Date(),
}: Dependencies): SyncQueue {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  let followUp: { ignoreSchedule: boolean } | null = null;
  let stopped = false;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const scheduleNext = async () => {
    clearTimer();
    if (stopped || !isOnline()) return;
    const times = (await repository.getBookings())
      .filter((record) => isAutoRetryable(record) && record.sync.nextRetryAt !== null)
      .map((record) => new Date(record.sync.nextRetryAt as string).getTime());
    if (times.length === 0) return;
    const delay = Math.max(0, Math.min(...times) - now().getTime());
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, delay);
  };

  const attemptAll = async (ignoreSchedule: boolean) => {
    const records = await repository.getBookings();
    const due = records.filter((record) =>
      ignoreSchedule ? isAutoRetryable(record) : isDue(record, now())
    );
    for (const record of due) {
      if (stopped || !isOnline()) return;
      onSettled(await repository.syncBooking(record.booking.id, now()));
    }
  };

  const run = (options: { ignoreSchedule?: boolean } = {}): Promise<void> => {
    const ignoreSchedule = options.ignoreSchedule ?? false;
    if (stopped) return Promise.resolve();
    if (running) {
      followUp = { ignoreSchedule: ignoreSchedule || (followUp?.ignoreSchedule ?? false) };
      return running;
    }
    running = (async () => {
      let next: { ignoreSchedule: boolean } | null = { ignoreSchedule };
      while (next && !stopped) {
        const current = next;
        followUp = null;
        if (isOnline()) await attemptAll(current.ignoreSchedule);
        next = followUp;
      }
      await scheduleNext();
    })().finally(() => {
      running = null;
    });
    return running;
  };

  return {
    run,
    async retryNow(id) {
      onSettled(await repository.resetForManualRetry(id));
      await run();
    },
    stop() {
      stopped = true;
      clearTimer();
    },
  };
}
