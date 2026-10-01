import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { LOCAL_ONLY_TEXT } from '../../src/components/LocalOnlyNote';
import { BookingProvider } from '../../src/context/BookingContext';
import { cars } from '../../src/data/dummy/cars';
import type { StoredBooking } from '../../src/repositories/bookingRepository';
import ProfileScreen from '../../src/screens/ProfileScreen';
import type { UserProfile } from '../../src/types';
import { makeBookingRepository } from '../helpers/bookingRepositoryFake';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { stubFavourites } from '../helpers/favouritesStub';
import { stubProfile } from '../helpers/profileStub';
import { storedBooking } from '../helpers/storedBooking';

/** Today is 28 September 2026 in these tests. */
const NOW = new Date(2026, 8, 28, 10, 0);

/** Lets the stored profile, favourites and bookings be read, inside act. */
async function settle() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

async function renderScreen({
  profile = null as UserProfile | null,
  favourites = [] as string[],
  bookings = [] as StoredBooking[],
} = {}) {
  const profileStub = stubProfile(profile);
  stubFavourites(favourites);
  const repo = stubCarRepository();
  const fake = makeBookingRepository(bookings);
  const view = render(
    <BookingProvider repository={fake.repository}>
      <ProfileScreen />
    </BookingProvider>
  );
  repo.emitCars(cars);
  await settle();
  return { ...profileStub, ...view };
}

const nameField = () => screen.getByLabelText(/^Your name/);
const emailField = () => screen.getByLabelText(/^Email/);

async function saveDetails() {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Save details' }));
  });
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(async () => {
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('saves the name and email on this phone and says so', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const { stored } = await renderScreen();

    fireEvent.changeText(nameField(), 'Mette Frederiksen');
    fireEvent.changeText(emailField(), 'mette@example.dk');
    await saveDetails();

    expect(stored()).toEqual({ name: 'Mette Frederiksen', email: 'mette@example.dk' });
    expect(screen.getByText('Details saved on this phone.')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Details saved');
  });

  it('shows the saved details when the screen is opened again', async () => {
    const { unmount } = await renderScreen({
      profile: { name: 'Mette Frederiksen', email: 'mette@example.dk' },
    });
    unmount();

    render(
      <BookingProvider repository={makeBookingRepository().repository}>
        <ProfileScreen />
      </BookingProvider>
    );
    await settle();

    expect(nameField().props.value).toBe('Mette Frederiksen');
    expect(emailField().props.value).toBe('mette@example.dk');
  });

  it('checks the details with the same rules and messages as the booking form', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const { write } = await renderScreen();

    fireEvent.changeText(emailField(), 'mette@');
    await saveDetails();

    expect(screen.getByText('Error: Enter your name.')).toBeTruthy();
    expect(
      screen.getByText('Error: Enter a valid email address, like name@example.com.')
    ).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('2 fields need attention');
    expect(write).not.toHaveBeenCalled();
  });

  it('says so when the details could not be saved', async () => {
    const { write } = await renderScreen();
    write.mockRejectedValueOnce(new Error('disk full'));

    fireEvent.changeText(nameField(), 'Mette');
    fireEvent.changeText(emailField(), 'mette@example.dk');
    await saveDetails();

    expect(screen.getByText("Error: Couldn't save your details. Try again.")).toBeTruthy();
    expect(screen.queryByText('Details saved on this phone.')).toBeNull();
  });

  it('lets the user choose a preferred pick-up from the listed locations, or none', async () => {
    const { stored } = await renderScreen();
    fireEvent.changeText(nameField(), 'Mette');
    fireEvent.changeText(emailField(), 'mette@example.dk');

    expect(screen.getByRole('radio', { name: 'Any' })).toBeChecked();
    fireEvent.press(screen.getByRole('radio', { name: 'Svendborg' }));
    await saveDetails();

    expect(screen.getByRole('radio', { name: 'Svendborg' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Any' })).not.toBeChecked();
    expect(stored()?.preferredLocation).toBe('Svendborg');
  });

  it('counts bookings made, saved cars and the next booking from the data on this phone', async () => {
    const past = storedBooking({ id: 'past', carId: 'car-01' });
    await renderScreen({
      favourites: ['car-05', 'car-01'],
      bookings: [
        storedBooking({ id: 'upcoming', carId: 'car-05' }),
        { ...past, booking: { ...past.booking, startDate: '2026-09-01', endDate: '2026-09-02' } },
      ],
    });

    expect(screen.getByLabelText('Bookings made: 2')).toBeTruthy();
    expect(screen.getByLabelText('Saved cars: 2')).toBeTruthy();
    expect(screen.getByLabelText('Next booking: Tesla Model 3, 1.–3. okt. 2026')).toBeTruthy();
  });

  it('shows zero and none when nothing is booked or saved, and invents nothing', async () => {
    await renderScreen();

    expect(screen.getByLabelText('Bookings made: 0')).toBeTruthy();
    expect(screen.getByLabelText('Saved cars: 0')).toBeTruthy();
    expect(screen.getByLabelText('Next booking: None')).toBeTruthy();
  });

  it('says the profile lives on this phone only, with no account', async () => {
    await renderScreen();

    expect(screen.getByText(LOCAL_ONLY_TEXT)).toBeTruthy();
  });
});
