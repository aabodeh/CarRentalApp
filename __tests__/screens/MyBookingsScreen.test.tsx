import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { OFFLINE_TITLE } from '../../src/components/OfflineBanner';
import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import type { RootTabScreenProps } from '../../src/navigation/types';
import MyBookingsScreen from '../../src/screens/MyBookingsScreen';
import type { StoredBooking } from '../../src/storage/bookingStore';
import { formatPrice } from '../../src/utils/formatPrice';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';
import { storedBooking } from '../helpers/storedBooking';

type Props = RootTabScreenProps<'MyBookingsTab'>;

async function renderScreen(fake = makeBookingRepository()) {
  const repo = stubCarRepository();
  const navigation = { navigate: jest.fn() };
  const props = {
    navigation,
    route: { key: 'MyBookings-test', name: 'MyBookingsTab' },
  } as unknown as Props;
  render(
    <BookingProvider repository={fake.repository}>
      <MyBookingsScreen {...props} />
    </BookingProvider>
  );
  repo.emitCars(cars);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
  return { navigation, ...fake };
}

describe('MyBookingsScreen', () => {
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

  it('shows a loading placeholder while the bookings are read from the phone', async () => {
    const fake = makeBookingRepository();
    jest.spyOn(fake.repository, 'getBookings').mockReturnValue(new Promise(() => {}));

    await renderScreen(fake);

    expect(screen.getByLabelText('Loading bookings')).toBeTruthy();
  });

  it('offers a way into the car list when there are no bookings yet', async () => {
    const { navigation } = await renderScreen();

    expect(screen.getByText('No bookings yet')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Browse cars' }));

    expect(navigation.navigate).toHaveBeenCalledWith('CarsTab', { screen: 'CarList' });
  });

  it('shows an error, and loads again when the user taps try again', async () => {
    const fake = makeBookingRepository([
      storedBooking({ syncStatus: 'completed', sync: { attempts: 1 } }),
    ]);
    jest.spyOn(fake.repository, 'getBookings').mockRejectedValueOnce(new Error('disk'));
    await renderScreen(fake);

    expect(screen.getByText("Couldn't load your bookings")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
  });

  it('lists bookings newest first, each with its car, dates, total and sync status', async () => {
    const saved: StoredBooking[] = [
      storedBooking({
        id: 'older',
        carId: 'car-01',
        createdAt: '2026-09-27T08:00:00.000Z',
        syncStatus: 'completed',
        sync: { attempts: 1 },
      }),
      storedBooking({
        id: 'newer',
        carId: 'car-05',
        createdAt: '2026-09-28T08:00:00.000Z',
        syncStatus: 'failed',
        sync: { attempts: 4, rejected: false },
      }),
    ];
    await renderScreen(makeBookingRepository(saved));

    const headers = screen.getAllByRole('header').map((node) => node.props.children);
    expect(headers).toEqual(['Tesla Model 3', 'Fiat 500e']);
    expect(screen.getAllByText(`1.–3. okt. 2026 · ${formatPrice(1498)}`)).toHaveLength(2);
    expect(screen.getByLabelText('Booking status: Confirmed')).toBeTruthy();
    expect(screen.getByLabelText("Booking status: Couldn't save yet")).toBeTruthy();
  });

  it('offers "Try again" on a booking that could not be sent, and sends it', async () => {
    const fake = makeBookingRepository([
      storedBooking({ syncStatus: 'failed', sync: { attempts: 4 } }),
    ]);
    await renderScreen(fake);
    expect(screen.getByText('We couldn’t reach our server after several tries.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(fake.postBooking).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Booking status: Confirmed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('keeps the bookings on screen while offline and says they will sync', async () => {
    setOffline();
    await renderScreen(makeBookingRepository([storedBooking()]));

    expect(screen.getByText(OFFLINE_TITLE)).toBeTruthy();
    expect(screen.getByText('Bookings will sync when you’re back online.')).toBeTruthy();
    expect(
      screen.getByText('Saved on this phone. It will sync when you’re back online.')
    ).toBeTruthy();
    expect(screen.getByLabelText('Booking status: Saving…')).toBeTruthy();
  });
});
