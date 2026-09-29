import { useNetworkState } from 'expo-network';

/**
 * Switches the mocked network status (see jest.setup.js) for the current test. Call
 * `setOnline()` in afterEach, because the mock is module-wide.
 */
export const setOffline = () =>
  jest.mocked(useNetworkState).mockReturnValue({ isConnected: false, isInternetReachable: false });

export const setOnline = () =>
  jest.mocked(useNetworkState).mockReturnValue({ isConnected: true, isInternetReachable: true });
