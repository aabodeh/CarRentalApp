import { fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { carAccessibilityLabel } from '../../src/components/CarCard';
import { cars } from '../../src/data/dummy/cars';
import type { RootStackParamList } from '../../src/navigation/types';
import { carRepository } from '../../src/repositories/carRepository';
import CarListScreen from '../../src/screens/CarListScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CarList'>;

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
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading skeletons while the cars are being fetched', () => {
    jest.spyOn(carRepository, 'getCars').mockReturnValue(new Promise(() => {}));

    renderScreen();

    expect(screen.getByLabelText('Loading cars')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Cars on Funen' })).toBeTruthy();
  });

  it('shows every car once they have loaded', async () => {
    jest.spyOn(carRepository, 'getCars').mockResolvedValue(cars);

    renderScreen();

    expect(await screen.findByText('10 cars · 8 available')).toBeTruthy();
    for (const car of cars) {
      expect(screen.getByRole('button', { name: carAccessibilityLabel(car) })).toBeTruthy();
    }
    expect(screen.queryByLabelText('Loading cars')).toBeNull();
  });

  it('shows an error and recovers when the user taps retry', async () => {
    jest
      .spyOn(carRepository, 'getCars')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(cars);
    renderScreen();

    expect(await screen.findByText("Couldn't load the cars")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('10 cars · 8 available')).toBeTruthy();
    expect(screen.queryByText("Couldn't load the cars")).toBeNull();
  });

  it('shows the empty state when there are no cars', async () => {
    jest.spyOn(carRepository, 'getCars').mockResolvedValue([]);

    renderScreen();

    expect(await screen.findByText('No cars right now')).toBeTruthy();
  });

  it('opens the details of the tapped car', async () => {
    jest.spyOn(carRepository, 'getCars').mockResolvedValue(cars);
    const { navigate } = renderScreen();

    fireEvent.press(await screen.findByRole('button', { name: carAccessibilityLabel(tesla) }));

    expect(navigate).toHaveBeenCalledWith('CarDetails', { carId: 'car-05' });
  });

  it('does not open the details of an unavailable car', async () => {
    jest.spyOn(carRepository, 'getCars').mockResolvedValue(cars);
    const { navigate } = renderScreen();

    const card = await screen.findByRole('button', { name: carAccessibilityLabel(unavailableCar) });
    fireEvent.press(card);

    expect(card).toBeDisabled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
