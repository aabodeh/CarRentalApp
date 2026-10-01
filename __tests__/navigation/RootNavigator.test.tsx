import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import RootNavigator from '../../src/navigation/RootNavigator';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubFavourites } from '../helpers/favouritesStub';
import { stubProfile } from '../helpers/profileStub';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { storedBooking } from '../helpers/storedBooking';

// SafeAreaProvider-dependent navigators render nothing under Jest without the library's mock.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

async function renderApp(fake = makeBookingRepository()) {
  const repo = stubCarRepository();
  render(
    <BookingProvider repository={fake.repository}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </BookingProvider>
  );
  repo.emitCars(cars);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
  });

  afterEach(async () => {
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('opens on the car list, in the Cars tab', async () => {
    await renderApp();

    expect(screen.getByRole('header', { name: 'Cars on Funen' })).toBeTruthy();
  });

  it('switches to My bookings when the user taps its tab', async () => {
    await renderApp();

    fireEvent.press(screen.getByLabelText('My bookings'));

    expect(await screen.findByText('No bookings yet')).toBeTruthy();
  });

  it('shows how many bookings could not be sent on the My bookings tab', async () => {
    const fake = makeBookingRepository([
      storedBooking({ id: 'a', syncStatus: 'failed', sync: { attempts: 4 } }),
      storedBooking({ id: 'b', syncStatus: 'failed', sync: { attempts: 1, rejected: true } }),
    ]);

    await renderApp(fake);

    expect(screen.getByLabelText('My bookings, 2 not sent yet')).toBeTruthy();
  });
});

describe('RootNavigator tabs', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 10, 0) });
    stubFavourites();
    stubProfile();
  });

  afterEach(async () => {
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('has four labelled tabs: Cars, Saved, My bookings and Profile', async () => {
    await renderApp();

    for (const name of ['Cars', 'Saved', 'My bookings', 'Profile']) {
      expect(screen.getByLabelText(name)).toBeTruthy();
    }
    expect(screen.getByText('Bookings')).toBeTruthy();
  });

  it('marks only the open tab as selected', async () => {
    await renderApp();

    expect(screen.getByLabelText('Cars')).toBeSelected();
    expect(screen.getByLabelText('Saved')).not.toBeSelected();
  });

  it('opens Saved and Profile from their tabs', async () => {
    await renderApp();

    fireEvent.press(screen.getByLabelText('Saved'));
    expect(await screen.findByText('Nothing saved yet')).toBeTruthy();
    expect(screen.getByLabelText('Saved')).toBeSelected();

    fireEvent.press(screen.getByLabelText('Profile'));
    expect(await screen.findByRole('header', { name: 'Your details' })).toBeTruthy();
  });
});
