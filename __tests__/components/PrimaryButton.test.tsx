import { fireEvent, render, screen } from '@testing-library/react-native';

import PrimaryButton from '../../src/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('runs its action when pressed', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Book this car" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Book this car' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is announced as disabled and ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Book this car" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Book this car' });
    fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
