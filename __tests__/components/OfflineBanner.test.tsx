import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import OfflineBanner, { OFFLINE_MESSAGE, OFFLINE_TITLE } from '../../src/components/OfflineBanner';
import { setOffline, setOnline } from '../helpers/network';

describe('OfflineBanner', () => {
  // React Native's Jest preset already mocks announceForAccessibility with a jest.fn, and spyOn on
  // an existing mock returns that same mock — so its calls would carry over between tests.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setOnline();
  });

  it('is not shown while online', () => {
    render(<OfflineBanner />);

    expect(screen.queryByText(OFFLINE_TITLE)).toBeNull();
  });

  it('says what still works when offline', () => {
    setOffline();

    render(<OfflineBanner />);

    expect(screen.getByText(OFFLINE_TITLE)).toBeTruthy();
    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
    expect(OFFLINE_MESSAGE).toContain('still here');
    expect(OFFLINE_MESSAGE).toContain('availability may be out of date');
  });

  it('announces the change when the connection drops while the screen is open', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const { rerender } = render(<OfflineBanner />);

    setOffline();
    rerender(<OfflineBanner />);

    expect(announce).toHaveBeenCalledWith(`${OFFLINE_TITLE}. ${OFFLINE_MESSAGE}`);
  });

  it('does not announce again on every screen that opens while already offline', () => {
    setOffline();
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');

    render(<OfflineBanner />);

    expect(announce).not.toHaveBeenCalled();
  });
});
