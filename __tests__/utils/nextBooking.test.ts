import { nextBooking } from '../../src/utils/nextBooking';
import { storedBooking } from '../helpers/storedBooking';

const booking = (id: string, startDate: string, createdAt = '2026-09-01T00:00:00.000Z') => ({
  ...storedBooking({ id, createdAt }).booking,
  startDate,
  endDate: startDate,
});

describe('nextBooking', () => {
  it('picks the booking that starts soonest, today or later', () => {
    const result = nextBooking(
      [booking('late', '2026-10-20'), booking('soon', '2026-10-02'), booking('past', '2026-09-01')],
      '2026-09-30'
    );

    expect(result?.id).toBe('soon');
  });

  it('counts a booking starting today as upcoming', () => {
    expect(nextBooking([booking('today', '2026-09-30')], '2026-09-30')?.id).toBe('today');
  });

  it('is null when every booking has started', () => {
    expect(nextBooking([booking('past', '2026-09-01')], '2026-09-30')).toBeNull();
  });

  it('breaks a tie on start date by which was made first', () => {
    const result = nextBooking(
      [
        booking('second', '2026-10-02', '2026-09-02T00:00:00.000Z'),
        booking('first', '2026-10-02', '2026-09-01T00:00:00.000Z'),
      ],
      '2026-09-30'
    );

    expect(result?.id).toBe('first');
  });
});
