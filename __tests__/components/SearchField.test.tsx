import { fireEvent, render, screen } from '@testing-library/react-native';

import SearchField from '../../src/components/SearchField';

function renderField(value: string, onChangeText = jest.fn()) {
  render(
    <SearchField
      label="Make or model"
      accessibilityLabel="Search cars by make or model"
      value={value}
      onChangeText={onChangeText}
    />
  );
  return onChangeText;
}

describe('SearchField', () => {
  it('has an accessible name that contains its visible label', () => {
    renderField('');

    // The visible label is hidden from screen readers, because the input carries the name.
    expect(screen.getByText('Make or model', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByLabelText('Search cars by make or model')).toBeTruthy();
  });

  it('shows no clear control while empty', () => {
    renderField('');

    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('clears the search when the clear control is tapped', () => {
    const onChangeText = renderField('tesla');

    fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
