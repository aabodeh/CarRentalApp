import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { cars } from '../../src/data/dummy/cars';
import type { RootStackParamList } from '../../src/navigation/types';
import { CarNotFoundError, carRepository } from '../../src/repositories/carRepository';
import CarDetailsScreen from '../../src/screens/CarDetailsScreen';
import { formatPrice } from '../../src/utils/formatPrice';

type Props = NativeStackScreenProps<RootStackParamList, 'CarDetails'>;

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
    jest.restoreAllMocks();
  });

  it("shows the car's name, price and specs", async () => {
    jest.spyOn(carRepository, 'getCarById').mockResolvedValue(tesla);

    renderScreen('car-05');

    expect(await screen.findByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
    expect(screen.getByText(formatPrice(749), { exact: false })).toBeTruthy();
    expect(screen.getByLabelText('749 kroner per day')).toBeTruthy();
    expect(screen.getByLabelText('Seats: 5')).toBeTruthy();
    expect(screen.getByLabelText('Transmission: Automatic')).toBeTruthy();
    expect(screen.getByLabelText('Fuel: Electric')).toBeTruthy();
    expect(screen.getByLabelText('Pick-up: Odense C')).toBeTruthy();
    expect(screen.getByText('Available to book')).toBeTruthy();
    expect(carRepository.getCarById).toHaveBeenCalledWith('car-05');
  });

  it('shows a loading placeholder while the car is being fetched', () => {
    jest.spyOn(carRepository, 'getCarById').mockReturnValue(new Promise(() => {}));

    renderScreen('car-05');

    expect(screen.getByLabelText('Loading car')).toBeTruthy();
  });

  it('shows a not-found message with a way back when the car does not exist', async () => {
    jest.spyOn(carRepository, 'getCarById').mockRejectedValue(new CarNotFoundError('car-404'));
    const navigation = renderScreen('car-404');

    expect(await screen.findByText('This car is no longer listed')).toBeTruthy();
    expect(screen.queryByText('Try again')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Back to cars' }));

    expect(navigation.popToTop).toHaveBeenCalled();
  });

  it('shows an error with retry when loading fails', async () => {
    jest
      .spyOn(carRepository, 'getCarById')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(tesla);
    renderScreen('car-05');

    expect(await screen.findByText("Couldn't load this car")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('header', { name: 'Tesla Model 3' })).toBeTruthy();
  });

  it('disables booking and says why when the car is unavailable', async () => {
    jest.spyOn(carRepository, 'getCarById').mockResolvedValue(unavailable);
    const navigation = renderScreen(unavailable.id);

    const button = await screen.findByRole('button', { name: 'Book this car' });
    fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(screen.getByText('Not available right now — this car can’t be booked.')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('opens the booking form for this car', async () => {
    jest.spyOn(carRepository, 'getCarById').mockResolvedValue(tesla);
    const navigation = renderScreen('car-05');

    fireEvent.press(await screen.findByRole('button', { name: 'Book this car' }));

    expect(navigation.navigate).toHaveBeenCalledWith('Booking', { carId: 'car-05' });
  });

  it("puts the car's name in the header title", async () => {
    jest.spyOn(carRepository, 'getCarById').mockResolvedValue(tesla);
    const navigation = renderScreen('car-05');
    await screen.findByRole('header', { name: 'Tesla Model 3' });

    const lastOptions = navigation.setOptions.mock.calls.at(-1)?.[0];
    render(lastOptions.headerTitle());

    expect(screen.getByText('Tesla Model 3')).toBeTruthy();
  });
});
