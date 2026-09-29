import { renderHook } from '@testing-library/react-native';
import { useNetworkState } from 'expo-network';

import { isOfflineState, useNetworkStatus } from '../../src/hooks/useNetworkStatus';

import { setOnline } from '../helpers/network';

describe('useNetworkStatus', () => {
  afterEach(() => {
    setOnline();
  });

  it.each([
    ['no connection', { isConnected: false, isInternetReachable: false }, true],
    ['wifi without internet', { isConnected: true, isInternetReachable: false }, true],
    ['a working connection', { isConnected: true, isInternetReachable: true }, false],
    ['not known yet (just launched)', {}, false],
    ['connected, reachability unknown', { isConnected: true }, false],
  ])('treats %s as offline: %p', (_label, state, offline) => {
    jest.mocked(useNetworkState).mockReturnValue(state);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOffline).toBe(offline);
    expect(isOfflineState(state)).toBe(offline);
  });
});
