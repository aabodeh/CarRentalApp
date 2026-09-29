import { HeaderHeightContext } from '@react-navigation/elements';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, KeyboardAvoidingView, ScrollView } from 'react-native';

import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import type { RootStackParamList } from '../../src/navigation/types';
import type { BookingRepository } from '../../src/repositories/bookingRepository';
import BookingScreen from '../../src/screens/BookingScreen';
import { ApiNetworkError } from '../../src/services/api/client';
import { formatPrice } from '../../src/utils/formatPrice';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

const tesla = cars.find((car) => car.id === 'car-05')!;
const HEADER_HEIGHT = 56;

/** Today is 28 September 2026 in these tests; the form defaults to 28 → 29 September. */
const NOW = new Date(2026, 8, 28, 10, 0);

/** Lets pending promises (saving, the background sync) settle inside act. */
async function settle() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

async function renderScreen(fake = makeBookingRepository()) {
  const repo = stubCarRepository();
  const navigation = { navigate: jest.fn(), popToTop: jest.fn(), setOptions: jest.fn() };
  const props = {
    navigation,
    route: { key: 'Booking-test', name: 'Booking', params: { carId: 'car-05' } },
  } as unknown as Props;

  render(
    <HeaderHeightContext.Provider value={HEADER_HEIGHT}>
      <BookingProvider repository={fake.repository as BookingRepository}>
        <BookingScreen {...props} />
      </BookingProvider>
    </HeaderHeightContext.Provider>
  );
  repo.emitCars(cars);
  await settle();
  return { navigation, ...fake };
}

/** Picks a date in the native date picker, the way the iOS control reports it. */
function pickDate(label: string, date: Date) {
  fireEvent(screen.getByLabelText(label), 'change', {
    nativeEvent: { timestamp: date.getTime(), utcOffset: 0 },
  });
}

function fillValidRenter() {
  fireEvent.changeText(screen.getByLabelText('Your name'), 'Mette Frederiksen');
  fireEvent.changeText(screen.getByLabelText('Email'), 'mette@example.dk');
}

const submit = () => fireEvent.press(screen.getByRole('button', { name: 'Confirm booking' }));

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
    setOnline();
  });

  it('shows the car being booked and a price for the default dates', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
    expect(screen.getByText(`1 day × ${formatPrice(749)}`)).toBeTruthy();
  });

  it('rejects a blank name', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByLabelText('Email'), 'mette@example.dk');

    submit();

    expect(screen.getByText('Error: Enter your name.')).toBeTruthy();
    expect(screen.getByLabelText('Your name, error: Enter your name.')).toBeTruthy();
  });

  it('rejects a malformed email', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByLabelText('Your name'), 'Mette');
    fireEvent.changeText(screen.getByLabelText('Email'), 'mette@example');

    submit();

    expect(
      screen.getByText('Error: Enter a valid email address, like name@example.com.')
    ).toBeTruthy();
  });

  it('rejects an end date before the start date', async () => {
    await renderScreen();
    fillValidRenter();
    pickDate('Pick-up date', new Date(2026, 9, 5));
    pickDate('Return date', new Date(2026, 9, 3));

    submit();

    expect(screen.getByText('Error: Return must be on or after the pick-up date.')).toBeTruthy();
  });

  it('rejects a start date in the past', async () => {
    await renderScreen();
    fillValidRenter();
    pickDate('Pick-up date', new Date(2026, 8, 20));

    submit();

    expect(screen.getByText("Error: Pick-up can't be in the past.")).toBeTruthy();
  });

  it('announces how many fields need attention when submit fails', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderScreen();

    submit();

    expect(announce).toHaveBeenCalledWith('2 fields need attention');
  });

  it('updates the day count and total when the dates change', async () => {
    await renderScreen();

    pickDate('Pick-up date', new Date(2026, 9, 1));
    pickDate('Return date', new Date(2026, 9, 4));

    expect(screen.getByText(`3 days × ${formatPrice(749)}`)).toBeTruthy();
    expect(screen.getByText(formatPrice(2247))).toBeTruthy();
  });

  it('counts a same-day rental as one day and says so', async () => {
    await renderScreen();

    pickDate('Return date', new Date(2026, 8, 28));

    expect(screen.getByText(`1 day × ${formatPrice(749)}`)).toBeTruthy();
    expect(screen.getByText('Same-day return counts as 1 day.')).toBeTruthy();
  });

  it('creates a pending booking on submit', async () => {
    const fake = makeBookingRepository();
    fake.postBooking.mockReturnValue(new Promise(() => {}));
    await renderScreen(fake);
    fillValidRenter();

    submit();
    await settle();

    expect(screen.getByRole('header', { name: 'Booking received' })).toBeTruthy();
    expect(screen.getByLabelText('Booking status: Saving…')).toBeTruthy();
    expect(fake.stored()).toHaveLength(1);
    expect(fake.stored()[0]).toMatchObject({
      carId: 'car-05',
      renterName: 'Mette Frederiksen',
      syncStatus: 'pending',
    });
  });

  it('shows the booking as confirmed once it has synced', async () => {
    await renderScreen();
    fillValidRenter();

    submit();
    await settle();

    expect(screen.getByLabelText('Booking status: Confirmed')).toBeTruthy();
  });

  it('creates only one booking when submit is pressed twice', async () => {
    const fake = makeBookingRepository();
    const createSpy = jest.spyOn(fake.repository, 'createBooking');
    await renderScreen(fake);
    fillValidRenter();

    const button = screen.getByRole('button', { name: 'Confirm booking' });
    fireEvent.press(button);
    fireEvent.press(button);
    await settle();

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps the submit button reachable with the keyboard open', async () => {
    // Jest has no real keyboard, so this guards the configuration that makes it work on a device:
    // iOS pads by the keyboard height offset by the header, and taps land while it is open.
    await renderScreen();

    const avoiding = screen.UNSAFE_getByType(KeyboardAvoidingView);
    expect(avoiding.props.behavior).toBe('padding');
    expect(avoiding.props.keyboardVerticalOffset).toBe(HEADER_HEIGHT);
    expect(screen.UNSAFE_getByType(ScrollView).props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('goes back to the car list from the confirmation', async () => {
    const { navigation } = await renderScreen();
    fillValidRenter();
    submit();
    await settle();

    fireEvent.press(screen.getByRole('button', { name: 'Back to cars' }));

    expect(navigation.popToTop).toHaveBeenCalled();
  });

  it('saves a booking made offline as pending, and says it will sync', async () => {
    const fake = makeBookingRepository();
    fake.postBooking.mockRejectedValue(new ApiNetworkError(new Error('Network request failed')));
    setOffline();
    await renderScreen(fake);
    fillValidRenter();

    submit();
    await settle();

    expect(screen.getByLabelText('Booking status: Saving…')).toBeTruthy();
    expect(
      screen.getByText('Saved on this phone. It will sync when you’re back online.')
    ).toBeTruthy();
    expect(fake.stored()[0].syncStatus).toBe('pending');
  });
});
