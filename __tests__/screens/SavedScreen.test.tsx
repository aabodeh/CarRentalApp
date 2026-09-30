import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { carAccessibilityLabel } from '../../src/components/CarCard';
import { cars } from '../../src/data/dummy/cars';
import type { RootTabScreenProps } from '../../src/navigation/types';
import SavedScreen from '../../src/screens/SavedScreen';
import { stubCarRepository } from '../helpers/carRepositoryStub';
import { stubFavourites } from '../helpers/favouritesStub';

type Props = RootTabScreenProps<'SavedTab'>;

const tesla = cars.find((car) => car.id === 'car-05')!;
const fiat = cars.find((car) => car.id === 'car-01')!;

/** Lets the stored favourites be read, inside act. */
async function settle() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

async function renderScreen(saved: string[], listed = cars) {
  const favourites = stubFavourites(saved);
  const repo = stubCarRepository();
  const navigate = jest.fn();
  const props = {
    navigation: { navigate },
    route: { key: 'Saved-test', name: 'SavedTab' },
  } as unknown as Props;
  render(<SavedScreen {...props} />);
  repo.emitCars(listed);
  await settle();
  return { navigate, favourites };
}

describe('SavedScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('lists the saved cars, most recently saved first, as the same cards as the catalogue', async () => {
    await renderScreen(['car-01', 'car-05']);

    const cards = screen
      .getAllByRole('button')
      .filter((button) =>
        [tesla, fiat].some((car) => button.props.accessibilityLabel === carAccessibilityLabel(car))
      );
    expect(cards.map((card) => card.props.accessibilityLabel)).toEqual([
      carAccessibilityLabel(tesla),
      carAccessibilityLabel(fiat),
    ]);
    expect(screen.getByText('2 cars')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove Tesla Model 3 from saved' })).toBeSelected();
  });

  it('shows an empty state that leads to the car list when nothing is saved', async () => {
    const { navigate } = await renderScreen([]);

    expect(screen.getByRole('header', { name: 'Nothing saved yet' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Browse cars' }));

    expect(navigate).toHaveBeenCalledWith('CarsTab', { screen: 'CarList' });
  });

  it('opens a saved car in the Cars tab', async () => {
    const { navigate } = await renderScreen(['car-05']);

    fireEvent.press(screen.getByRole('button', { name: carAccessibilityLabel(tesla) }));

    expect(navigate).toHaveBeenCalledWith('CarsTab', {
      screen: 'CarDetails',
      params: { carId: 'car-05' },
    });
  });

  it('removes a car from the list when its heart is tapped', async () => {
    const { favourites } = await renderScreen(['car-05']);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove Tesla Model 3 from saved' }));
    });

    expect(favourites.stored()).toEqual([]);
    expect(screen.getByText('Nothing saved yet')).toBeTruthy();
  });

  it('keeps a saved car that left the catalogue, says so, and removes it only when asked', async () => {
    const { favourites } = await renderScreen(['car-05', 'car-gone']);

    expect(screen.getByText('1 saved car is no longer listed.')).toBeTruthy();
    expect(screen.getByRole('button', { name: carAccessibilityLabel(tesla) })).toBeTruthy();
    expect(favourites.stored()).toEqual(['car-05', 'car-gone']);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove it' }));
    });

    expect(favourites.stored()).toEqual(['car-05']);
    expect(screen.queryByText('1 saved car is no longer listed.')).toBeNull();
  });

  it('explains when none of the saved cars are listed any more', async () => {
    await renderScreen(
      ['car-05'],
      cars.filter((car) => car.id !== 'car-05')
    );

    expect(screen.getByRole('header', { name: 'None of your saved cars are listed' })).toBeTruthy();
    expect(screen.getByText('1 saved car is no longer listed.')).toBeTruthy();
  });

  it('shows an error with retry when the cars cannot be loaded', async () => {
    stubFavourites(['car-05']);
    const repo = stubCarRepository();
    const props = {
      navigation: { navigate: jest.fn() },
      route: { key: 'Saved-test', name: 'SavedTab' },
    } as unknown as Props;
    render(<SavedScreen {...props} />);
    await settle();
    repo.emitError(new Error('offline'));

    expect(screen.getByText("Couldn't load your saved cars")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(repo.refresh).toHaveBeenCalled();
  });
});
