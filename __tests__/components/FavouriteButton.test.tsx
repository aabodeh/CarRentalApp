import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import FavouriteButton, { favouriteLabel } from '../../src/components/FavouriteButton';

describe('FavouriteButton', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('offers to save a car that is not saved, and is not selected', () => {
    render(<FavouriteButton carName="Tesla Model 3" saved={false} onToggle={jest.fn()} />);

    const button = screen.getByRole('button', { name: 'Save Tesla Model 3' });
    expect(button).not.toBeSelected();
  });

  it('offers to remove a saved car, and is selected', () => {
    render(<FavouriteButton carName="Tesla Model 3" saved onToggle={jest.fn()} />);

    const button = screen.getByRole('button', { name: 'Remove Tesla Model 3 from saved' });
    expect(button).toBeSelected();
  });

  it('toggles with a selection haptic when tapped', () => {
    const haptic = jest.spyOn(Haptics, 'selectionAsync');
    const onToggle = jest.fn();
    render(<FavouriteButton carName="Tesla Model 3" saved={false} onToggle={onToggle} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalled();
  });

  it('names the car in both labels, since a list has one heart per car', () => {
    expect(favouriteLabel('Fiat 500e', false)).toBe('Save Fiat 500e');
    expect(favouriteLabel('Fiat 500e', true)).toBe('Remove Fiat 500e from saved');
  });
});
