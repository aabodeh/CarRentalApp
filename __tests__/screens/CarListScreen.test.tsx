import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { carAccessibilityLabel } from '../../src/components/CarCard';
import { cars } from '../../src/data/dummy/cars';
import type { CarsStackScreenProps } from '../../src/navigation/types';
import CarListScreen from '../../src/screens/CarListScreen';
import { OFFLINE_TITLE } from '../../src/components/OfflineBanner';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { setOffline, setOnline } from '../helpers/network';
import { stubFavourites } from '../helpers/favouritesStub';
import { inputDebounce } from '../../src/theme';

type Props = CarsStackScreenProps<'CarList'>;

function renderScreen() {
  const navigate = jest.fn();
  const props = {
    navigation: { navigate },
    route: { key: 'CarList-test', name: 'CarList' },
  } as unknown as Props;
  render(<CarListScreen {...props} />);
  return { navigate };
}

const tesla = cars.find((car) => car.id === 'car-05')!;
const unavailableCar = cars.find((car) => !car.available)!;

describe('CarListScreen', () => {
  // FlatList renders further rows on a timer. With real timers that timer could fire after a test
  // had finished, outside act(), and log an intermittent act() warning. Fake timers let each test
  // flush it deliberately, inside act(), before the next test starts.
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
    setOnline();
  });

  it('shows loading skeletons while the cars are being fetched', () => {
    stubCarRepository();

    renderScreen();

    expect(screen.getByLabelText('Loading cars')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Cars on Funen' })).toBeTruthy();
  });

  it('shows every car once they have loaded', async () => {
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars(cars);

    expect(await screen.findByText('10 cars · 8 available')).toBeTruthy();
    for (const car of cars) {
      expect(screen.getByRole('button', { name: carAccessibilityLabel(car) })).toBeTruthy();
    }
    expect(screen.queryByLabelText('Loading cars')).toBeNull();
  });

  it('shows an error and recovers when the user taps retry', async () => {
    const repo = stubCarRepository();
    renderScreen();
    repo.emitError(new Error('offline'));

    expect(await screen.findByText("Couldn't load the cars")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(repo.refresh).toHaveBeenCalled();
    repo.emitCars(cars);

    expect(await screen.findByText('10 cars · 8 available')).toBeTruthy();
    expect(screen.queryByText("Couldn't load the cars")).toBeNull();
  });

  it('shows the empty state when there are no cars', async () => {
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars([]);

    expect(await screen.findByText('No cars right now')).toBeTruthy();
  });

  it('opens the details of the tapped car', async () => {
    const repo = stubCarRepository();
    const { navigate } = renderScreen();
    repo.emitCars(cars);

    fireEvent.press(await screen.findByRole('button', { name: carAccessibilityLabel(tesla) }));

    expect(navigate).toHaveBeenCalledWith('CarDetails', { carId: 'car-05' });
  });

  it('does not open the details of an unavailable car', async () => {
    const repo = stubCarRepository();
    const { navigate } = renderScreen();
    repo.emitCars(cars);

    const card = await screen.findByRole('button', { name: carAccessibilityLabel(unavailableCar) });
    fireEvent.press(card);

    expect(card).toBeDisabled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows how long ago the cars were updated', () => {
    jest.setSystemTime(new Date('2026-09-29T10:05:00.000Z'));
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars(cars, { fetchedAt: '2026-09-29T10:00:00.000Z', freshness: 'fresh' });

    expect(screen.getByText('Updated 5 minutes ago')).toBeTruthy();
  });

  it('marks the list as a saved copy when it could not be refreshed', () => {
    jest.setSystemTime(new Date('2026-09-29T12:00:00.000Z'));
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars(cars, { fetchedAt: '2026-09-29T10:00:00.000Z', freshness: 'stale' });

    expect(screen.getByText('Saved copy · updated 2 hours ago')).toBeTruthy();
    expect(screen.getByText('10 cars · 8 available')).toBeTruthy();
  });

  it('shows the offline banner, and still shows the saved cars, when offline', () => {
    setOffline();
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars(cars, { freshness: 'stale' });

    expect(screen.getByText(OFFLINE_TITLE)).toBeTruthy();
    expect(screen.getByRole('button', { name: carAccessibilityLabel(tesla) })).toBeTruthy();
  });

  it('shows no offline banner when online', () => {
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars(cars);

    expect(screen.queryByText(OFFLINE_TITLE)).toBeNull();
  });
});

describe('CarListScreen search and filters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  // As above: no retry queue here, so a synchronous flush is enough (AGENTS.md > Lists in tests).
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const visibleCars = () =>
    cars.filter((car) => screen.queryByRole('button', { name: carAccessibilityLabel(car) }));

  function renderWithCars() {
    stubFavourites();
    const repo = stubCarRepository();
    const result = renderScreen();
    repo.emitCars(cars);
    return result;
  }

  const type = (text: string) =>
    fireEvent.changeText(screen.getByLabelText('Search cars by make or model'), text);

  const waitForTyping = () =>
    act(() => {
      jest.advanceTimersByTime(inputDebounce.ms);
    });

  it('finds cars by make or model once the user stops typing', () => {
    renderWithCars();

    type('volkswagen');
    expect(visibleCars()).toHaveLength(10);
    waitForTyping();

    expect(visibleCars().map((car) => car.id)).toEqual(['car-02', 'car-03', 'car-10']);
    expect(screen.getByText('Showing 3 of 10 cars')).toBeTruthy();
  });

  it('filters by several fuels at once and says how many cars match', () => {
    renderWithCars();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Electric' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Hybrid' }));

    expect(screen.getByRole('checkbox', { name: 'Electric' })).toBeChecked();
    expect(visibleCars().map((car) => car.fuel)).toEqual([
      'electric',
      'electric',
      'hybrid',
      'hybrid',
    ]);
    expect(screen.getByText('Showing 4 of 10 cars')).toBeTruthy();
  });

  it('shows a no-results state, not the empty state, and clears the filters from it', () => {
    renderWithCars();
    type('trabant');
    waitForTyping();

    expect(screen.getByText('No cars match')).toBeTruthy();
    expect(screen.queryByText('No cars right now')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));

    expect(visibleCars()).toHaveLength(10);
    expect(screen.getByText('Showing all 10 cars')).toBeTruthy();
  });

  it('shows every car again at once when the search is cleared', () => {
    renderWithCars();
    type('tesla');
    waitForTyping();
    expect(visibleCars()).toHaveLength(1);

    fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(visibleCars()).toHaveLength(10);
  });

  it('offers only the fuels and transmissions that some car has', () => {
    stubFavourites();
    const repo = stubCarRepository();
    renderScreen();

    repo.emitCars(cars.filter((car) => car.fuel === 'electric'));

    expect(screen.getByRole('checkbox', { name: 'Electric' })).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Diesel' })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Manual' })).toBeNull();
  });

  it('saves a car from its heart, and the heart then says it is saved', async () => {
    const favourites = stubFavourites();
    const repo = stubCarRepository();
    renderScreen();
    repo.emitCars(cars);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Tesla Model 3' }));
    });

    expect(screen.getByRole('button', { name: 'Remove Tesla Model 3 from saved' })).toBeSelected();
    expect(favourites.stored()).toEqual(['car-05']);
  });
});
