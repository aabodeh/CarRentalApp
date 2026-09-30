import { syncExplanation } from '../../src/components/BookingRow';
import { storedBooking } from '../helpers/storedBooking';

describe('syncExplanation', () => {
  it.each([
    [
      'a confirmed booking',
      storedBooking({ syncStatus: 'completed', sync: { attempts: 1 } }),
      false,
      'Confirmed by our server.',
    ],
    [
      'a pending booking while offline',
      storedBooking(),
      true,
      'Saved on this phone. It will sync when you’re back online.',
    ],
    [
      'a pending booking while online',
      storedBooking(),
      false,
      'Saved on this phone. Sending it now.',
    ],
    [
      'a failed booking with a retry coming',
      storedBooking({
        syncStatus: 'failed',
        sync: { attempts: 1, nextRetryAt: '2026-09-28T08:00:02.000Z' },
      }),
      false,
      'We couldn’t reach our server. Trying again automatically.',
    ],
    [
      'a failed booking out of retries',
      storedBooking({ syncStatus: 'failed', sync: { attempts: 4 } }),
      false,
      'We couldn’t reach our server after several tries.',
    ],
    [
      'a booking the server refused',
      storedBooking({ syncStatus: 'failed', sync: { attempts: 1, rejected: true } }),
      false,
      'Our server didn’t accept this booking.',
    ],
  ])('explains %s', (_label, record, offline, expected) => {
    expect(syncExplanation(record, offline)).toBe(expected);
  });
});
