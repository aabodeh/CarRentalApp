import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import SyncStatusBadge from '../../src/components/SyncStatusBadge';

describe('SyncStatusBadge', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['pending', 'Saving…'],
    ['failed', "Couldn't save yet"],
    ['completed', 'Confirmed'],
  ] as const)('shows %s as the words "%s", not only a colour', (status, words) => {
    render(<SyncStatusBadge status={status} />);

    expect(screen.getByText(words)).toBeTruthy();
    expect(screen.getByLabelText(`Booking status: ${words}`)).toBeTruthy();
  });

  it('announces the new status when it changes', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const { rerender } = render(<SyncStatusBadge status="pending" />);
    expect(announce).not.toHaveBeenCalled();

    rerender(<SyncStatusBadge status="completed" />);

    expect(announce).toHaveBeenCalledWith('Booking status: Confirmed');
  });
});
