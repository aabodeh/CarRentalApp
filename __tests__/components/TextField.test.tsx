import { fireEvent, render, screen } from '@testing-library/react-native';

import TextField from '../../src/components/TextField';

describe('TextField', () => {
  it('shows a visible label and uses it as the accessibility label', () => {
    render(<TextField label="Email" value="" onChangeText={jest.fn()} />);

    // The visible label is hidden from screen readers on purpose — the input already carries it
    // as its accessibility label, so it would otherwise be read twice. Hence includeHiddenElements.
    expect(screen.getByText('Email', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('shows the error as text and ties it to the field for screen readers', () => {
    render(
      <TextField label="Email" value="x" onChangeText={jest.fn()} error="Enter a valid email." />
    );

    expect(screen.getByText('Error: Enter a valid email.')).toBeTruthy();
    expect(screen.getByLabelText('Email, error: Enter a valid email.')).toBeTruthy();
  });

  it('reports what the user types', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Name" value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Mette');

    expect(onChangeText).toHaveBeenCalledWith('Mette');
  });
});
