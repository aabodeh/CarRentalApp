import { fireEvent, render, screen } from '@testing-library/react-native';

import StateView from '../../src/components/StateView';

describe('StateView', () => {
  it('shows the title as a heading and the message', () => {
    render(<StateView title="No cars right now" message="Pull down to check again." />);

    expect(screen.getByRole('header', { name: 'No cars right now' })).toBeTruthy();
    expect(screen.getByText('Pull down to check again.')).toBeTruthy();
  });

  it('runs the action when its button is pressed', () => {
    const onAction = jest.fn();
    render(
      <StateView title="Error" message="Try again." actionLabel="Try again" onAction={onAction} />
    );

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows no button when there is no action', () => {
    render(<StateView title="No cars right now" message="Pull down to check again." />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
