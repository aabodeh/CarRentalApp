import { fireEvent, render, screen } from '@testing-library/react-native';

import CarCard, { carAccessibilityLabel } from '../../src/components/CarCard';
import { cars } from '../../src/data/dummy/cars';
import { formatPrice } from '../../src/utils/formatPrice';

const tesla = cars.find((car) => car.id === 'car-05')!;
const mercedes = cars.find((car) => car.id === 'car-09')!;

describe('CarCard', () => {
  it.each(cars.map((car) => [car.id, car] as const))(
    'exposes %s to screen readers as a button with a sentence label',
    (_id, car) => {
      render(<CarCard car={car} index={0} onPress={jest.fn()} />);

      expect(screen.getByRole('button', { name: carAccessibilityLabel(car) })).toBeTruthy();
    }
  );

  it('reads the price as plain kroner, not the Danish-formatted number', () => {
    expect(carAccessibilityLabel(tesla)).toBe('Tesla Model 3 2024, 749 kroner per day, Odense C');
  });

  it('says an unavailable car is not available right now', () => {
    expect(carAccessibilityLabel(mercedes)).toBe(
      'Mercedes-Benz C 200 Coupé AMG Line 2022, 1195 kroner per day, Odense Banegård, not available right now'
    );
  });

  it('shows the name, metadata and the price per day', () => {
    render(<CarCard car={tesla} index={0} onPress={jest.fn()} />);

    expect(screen.getByText('Tesla Model 3')).toBeTruthy();
    expect(screen.getByText('5 seats')).toBeTruthy();
    expect(screen.getByText('Automatic')).toBeTruthy();
    expect(screen.getByText('Electric')).toBeTruthy();
    expect(screen.getByText(`${formatPrice(749)} / day`)).toBeTruthy();
  });

  it('tells the user why an unavailable car cannot be booked, instead of its price', () => {
    render(<CarCard car={mercedes} index={0} onPress={jest.fn()} />);

    expect(screen.getByText('Not available right now')).toBeTruthy();
    expect(screen.queryByText(/kr\./)).toBeNull();
  });

  it('reports the car id when pressed', () => {
    const onPress = jest.fn();
    render(<CarCard car={tesla} index={0} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledWith('car-05');
  });
});

describe('CarCard heart', () => {
  it('shows no heart unless the screen can save cars', () => {
    render(<CarCard car={tesla} index={0} onPress={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Save Tesla Model 3' })).toBeNull();
  });

  it('saves the car from the heart, separately from opening it', () => {
    const onPress = jest.fn();
    const onToggleSaved = jest.fn();
    render(<CarCard car={tesla} index={0} onPress={onPress} onToggleSaved={onToggleSaved} />);

    fireEvent.press(screen.getByRole('button', { name: 'Save Tesla Model 3' }));

    expect(onToggleSaved).toHaveBeenCalledWith('car-05');
    expect(onPress).not.toHaveBeenCalled();
  });

  it('lets an unavailable car be saved for later', () => {
    const onToggleSaved = jest.fn();
    render(<CarCard car={mercedes} index={0} onPress={jest.fn()} onToggleSaved={onToggleSaved} />);

    fireEvent.press(
      screen.getByRole('button', { name: 'Save Mercedes-Benz C 200 Coupé AMG Line' })
    );

    expect(onToggleSaved).toHaveBeenCalledWith('car-09');
  });
});
