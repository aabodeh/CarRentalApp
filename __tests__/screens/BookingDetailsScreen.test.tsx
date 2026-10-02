import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { OFFLINE_TITLE } from '../../src/components/OfflineBanner';
import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import type { MyBookingsStackScreenProps } from '../../src/navigation/types';
import BookingDetailsScreen from '../../src/screens/BookingDetailsScreen';
import { formatPrice } from '../../src/utils/formatPrice';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';
import { storedBooking } from '../helpers/storedBooking';

type Props = MyBookingsStackScreenProps<'BookingDetails'>;

const BOOKING_ID = 'booking-mg8xk2lq-1';
const CODE = 'MG8XK2LQ-1';
const NOT_CONFIRMED = 'Your booking code and QR appear here once our server has confirmed it.';

const flush = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });

async function renderScreen(fake = makeBookingRepository(), bookingId = BOOKING_ID) {
  const repo = stubCarRepository();
  const navigation = { navigate: jest.fn() };
  const props = {
    navigation,
    route: { key: 'BookingDetails-test', name: 'BookingDetails', params: { bookingId } },
  } as unknown as Props;
  // A function, not one element: React skips re-rendering an element it has already rendered.
  const tree = () => (
    <BookingProvider repository={fake.repository}>
      <BookingDetailsScreen {...props} />
    </BookingProvider>
  );
  render(tree());
  repo.emitCars(cars);
  await flush();
  return { navigation, rerender: () => screen.rerender(tree()), ...fake };
}

describe('BookingDetailsScreen', () => {
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

  it('shows the booking: car, dates, total, renter and sync status', async () => {
    await renderScreen(
      makeBookingRepository([
        storedBooking({ id: BOOKING_ID, syncStatus: 'completed', sync: { attempts: 1 } }),
      ])
    );

    expect(screen.getByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
    expect(screen.getByText(`1.–3. okt. 2026 · ${formatPrice(1498)}`)).toBeTruthy();
    expect(screen.getByText('Mette Frederiksen')).toBeTruthy();
    expect(screen.getByText('mette@example.dk')).toBeTruthy();
    expect(screen.getByLabelText('Booking status: Confirmed')).toBeTruthy();
    expect(screen.getByText('Confirmed by our server.')).toBeTruthy();
  });

  it('shows the booking code and QR once the booking is confirmed', async () => {
    await renderScreen(
      makeBookingRepository([
        storedBooking({ id: BOOKING_ID, syncStatus: 'completed', sync: { attempts: 1 } }),
      ])
    );

    expect(screen.getByText(CODE)).toBeTruthy();
    expect(screen.getByLabelText('Booking code: M G 8 X K 2 L Q - 1')).toBeTruthy();
    expect(screen.getByRole('image', { name: `QR code for booking ${CODE}` })).toBeTruthy();
    expect(screen.queryByText(NOT_CONFIRMED)).toBeNull();
  });

  it('says the booking is not confirmed yet, without a code or QR, while it is pending', async () => {
    setOffline();
    await renderScreen(makeBookingRepository([storedBooking({ id: BOOKING_ID })]));

    expect(screen.getByText('Not confirmed yet')).toBeTruthy();
    expect(screen.getByText(NOT_CONFIRMED)).toBeTruthy();
    expect(screen.queryByText(CODE)).toBeNull();
    expect(screen.queryByRole('image', { name: `QR code for booking ${CODE}` })).toBeNull();
  });

  it('shows the code and QR when the booking is confirmed while the screen is open', async () => {
    setOffline();
    const { rerender } = await renderScreen(
      makeBookingRepository([storedBooking({ id: BOOKING_ID })])
    );
    expect(screen.getByText(NOT_CONFIRMED)).toBeTruthy();

    setOnline();
    rerender();
    await flush();

    expect(screen.getByLabelText('Booking status: Confirmed')).toBeTruthy();
    expect(screen.getByText(CODE)).toBeTruthy();
    expect(screen.queryByText(NOT_CONFIRMED)).toBeNull();
  });

  it('offers "Try again" on a booking that could not be sent, and sends it', async () => {
    const fake = makeBookingRepository([
      storedBooking({ id: BOOKING_ID, syncStatus: 'failed', sync: { attempts: 4 } }),
    ]);
    await renderScreen(fake);
    expect(screen.getByText('We couldn’t reach our server after several tries.')).toBeTruthy();
    expect(screen.queryByText(CODE)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await flush();

    expect(fake.postBooking).toHaveBeenCalledTimes(1);
    expect(screen.getByText(CODE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('shows the booking offline, code and QR included', async () => {
    setOffline();
    await renderScreen(
      makeBookingRepository([
        storedBooking({ id: BOOKING_ID, syncStatus: 'completed', sync: { attempts: 1 } }),
      ])
    );

    expect(screen.getByText(OFFLINE_TITLE)).toBeTruthy();
    expect(screen.getByText(CODE)).toBeTruthy();
    expect(screen.getByRole('image', { name: `QR code for booking ${CODE}` })).toBeTruthy();
  });

  it('says the booking is no longer on this phone when it cannot be found, with a way back', async () => {
    const { navigation } = await renderScreen(makeBookingRepository(), 'booking-404');

    expect(screen.getByText('Booking not found')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back to my bookings' }));

    expect(navigation.navigate).toHaveBeenCalledWith('MyBookingsList');
  });

  it('shows an error, and loads again when the user taps try again', async () => {
    const fake = makeBookingRepository([
      storedBooking({ id: BOOKING_ID, syncStatus: 'completed', sync: { attempts: 1 } }),
    ]);
    jest.spyOn(fake.repository, 'getBookings').mockRejectedValueOnce(new Error('disk'));
    await renderScreen(fake);

    expect(screen.getByText("Couldn't load this booking")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await flush();

    expect(screen.getByText(CODE)).toBeTruthy();
  });
});
