import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { cars } from '../../src/data/dummy/cars';
import type { CarsStackScreenProps } from '../../src/navigation/types';
import CarDetailsScreen from '../../src/screens/CarDetailsScreen';
import { formatPrice } from '../../src/utils/formatPrice';
import { OFFLINE_TITLE } from '../../src/components/OfflineBanner';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';

type Props = CarsStackScreenProps<'CarDetails'>;

const tesla = cars.find((car) => car.id === 'car-05')!;
const unavailable = cars.find((car) => !car.available)!;

function renderScreen(carId: string) {
  const navigation = { navigate: jest.fn(), popToTop: jest.fn(), setOptions: jest.fn() };
  const props = {
    navigation,
    route: { key: 'CarDetails-test', name: 'CarDetails', params: { carId } },
  } as unknown as Props;
  render(<CarDetailsScreen {...props} />);
  return navigation;
}

describe('CarDetailsScreen', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    setOnline();
  });

  it("shows the car's name, price and specs", async () => {
    const repo = stubCarRepository();
    renderScreen('car-05');
    repo.emitCars(cars);

    expect(await screen.findByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
    expect(screen.getByText(formatPrice(749), { exact: false })).toBeTruthy();
    expect(screen.getByLabelText('749 kroner per day')).toBeTruthy();
    expect(screen.getByLabelText('Seats: 5')).toBeTruthy();
    expect(screen.getByLabelText('Transmission: Automatic')).toBeTruthy();
    expect(screen.getByLabelText('Fuel: Electric')).toBeTruthy();
    expect(screen.getByLabelText('Pick-up: Odense C')).toBeTruthy();
    expect(screen.getByText('Available to book')).toBeTruthy();
  });

  it('shows a loading placeholder while the car is being fetched', () => {
    stubCarRepository();

    renderScreen('car-05');

    expect(screen.getByLabelText('Loading car')).toBeTruthy();
  });

  it('shows a not-found message with a way back when the car does not exist', async () => {
    const repo = stubCarRepository();
    const navigation = renderScreen('car-404');
    repo.emitCars(cars);

    expect(await screen.findByText('This car is no longer listed')).toBeTruthy();
    expect(screen.queryByText('Try again')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Back to cars' }));

    expect(navigation.popToTop).toHaveBeenCalled();
  });

  it('shows an error with retry when loading fails', async () => {
    const repo = stubCarRepository();
    renderScreen('car-05');
    repo.emitError(new Error('offline'));

    expect(await screen.findByText("Couldn't load this car")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(repo.refresh).toHaveBeenCalled();
    repo.emitCars(cars);

    expect(await screen.findByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
  });

  it('disables booking and says why when the car is unavailable', async () => {
    const repo = stubCarRepository();
    const navigation = renderScreen(unavailable.id);
    repo.emitCars(cars);

    const button = await screen.findByRole('button', { name: 'Book this car' });
    fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(screen.getByText('Not available right now — this car can’t be booked.')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('opens the booking form for this car', async () => {
    const repo = stubCarRepository();
    const navigation = renderScreen('car-05');
    repo.emitCars(cars);

    fireEvent.press(await screen.findByRole('button', { name: 'Book this car' }));

    expect(navigation.navigate).toHaveBeenCalledWith('Booking', { carId: 'car-05' });
  });

  it("puts the car's name in the header title", async () => {
    const repo = stubCarRepository();
    const navigation = renderScreen('car-05');
    repo.emitCars(cars);
    await screen.findByRole('header', { name: 'Tesla Model 3' });

    const lastOptions = navigation.setOptions.mock.calls.at(-1)?.[0];
    render(lastOptions.headerTitle());

    expect(screen.getByText('Tesla Model 3')).toBeTruthy();
  });

  it('marks the car as a saved copy, with its age, when it could not be refreshed', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-29T12:00:00.000Z') });
    const repo = stubCarRepository();
    renderScreen('car-05');

    repo.emitCars(cars, { fetchedAt: '2026-09-29T10:00:00.000Z', freshness: 'stale' });

    expect(screen.getByText('Saved copy · updated 2 hours ago')).toBeTruthy();
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  it('says nothing about age when the car is fresh from the server', async () => {
    const repo = stubCarRepository();
    renderScreen('car-05');

    repo.emitCars(cars, { freshness: 'fresh' });

    expect(await screen.findByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
    expect(screen.queryByText(/updated/)).toBeNull();
  });

  it('opens a car that was already seen while offline, with the offline banner', async () => {
    setOffline();
    const repo = stubCarRepository();
    renderScreen('car-05');

    repo.emitCars(cars, { freshness: 'stale' });

    expect(await screen.findByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
    expect(screen.getByText(OFFLINE_TITLE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Book this car' })).toBeEnabled();
  });
});
