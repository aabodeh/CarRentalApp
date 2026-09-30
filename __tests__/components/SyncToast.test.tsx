import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import SyncToast from '../../src/components/SyncToast';
import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import { ApiStatusError } from '../../src/services/api/client';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { storedBooking } from '../helpers/storedBooking';

const MESSAGE = 'Your booking for Tesla Model 3 is confirmed.';

/** A booking whose first attempt failed; the provider's start-up run sends it successfully. */
async function renderAfterRetrySucceeds() {
  const fake = makeBookingRepository([
    storedBooking({
      syncStatus: 'failed',
      sync: { attempts: 1, nextRetryAt: '2026-09-28T10:00:02.000Z' },
    }),
  ]);
  const repo = stubCarRepository();
  render(
    <BookingProvider repository={fake.repository}>
      <SyncToast />
    </BookingProvider>
  );
  repo.emitCars(cars);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
  return fake;
}

describe('SyncToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(async () => {
    // Async flush: a pending retry timer starts an async send, which must finish inside act.
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('tells the user, and announces it, when a booking that had failed is confirmed', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');

    await renderAfterRetrySucceeds();

    expect(screen.getByText(MESSAGE)).toBeTruthy();
    expect(announce).toHaveBeenCalledWith(MESSAGE);
  });

  it('hides itself after a few seconds', async () => {
    await renderAfterRetrySucceeds();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4_000);
    });

    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it('hides when tapped', async () => {
    await renderAfterRetrySucceeds();

    fireEvent.press(screen.getByRole('button', { name: MESSAGE }));

    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it('shows nothing when a booking is confirmed at the first attempt', async () => {
    const fake = makeBookingRepository([storedBooking()]);
    const repo = stubCarRepository();
    render(
      <BookingProvider repository={fake.repository}>
        <SyncToast />
      </BookingProvider>
    );
    repo.emitCars(cars);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(fake.stored()[0].booking.syncStatus).toBe('completed');
    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it('shows nothing while a retry keeps failing', async () => {
    const fake = makeBookingRepository([
      storedBooking({
        syncStatus: 'failed',
        sync: { attempts: 1, nextRetryAt: '2026-09-28T10:00:02.000Z' },
      }),
    ]);
    fake.postBooking.mockRejectedValue(new ApiStatusError(503));
    const repo = stubCarRepository();
    render(
      <BookingProvider repository={fake.repository}>
        <SyncToast />
      </BookingProvider>
    );
    repo.emitCars(cars);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(screen.queryByText(MESSAGE)).toBeNull();
  });
});
