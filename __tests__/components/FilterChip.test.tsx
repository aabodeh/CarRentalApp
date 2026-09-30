import { fireEvent, render, screen } from '@testing-library/react-native';

import FilterChip from '../../src/components/FilterChip';

describe('FilterChip', () => {
  it('is a labelled checkbox that says whether it is on', () => {
    const { rerender } = render(
      <FilterChip label="Electric" selected={false} onPress={jest.fn()} />
    );
    expect(screen.getByRole('checkbox', { name: 'Electric' })).not.toBeChecked();

    rerender(<FilterChip label="Electric" selected onPress={jest.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Electric' })).toBeChecked();
  });

  it('can be a radio button, for a group where only one can be on', () => {
    render(<FilterChip role="radio" label="Odense C" selected onPress={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'Odense C' })).toBeChecked();
  });

  it('reports a press', () => {
    const onPress = jest.fn();
    render(<FilterChip label="Manual" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('checkbox'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
