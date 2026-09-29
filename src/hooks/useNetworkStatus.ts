import { useNetworkState, type NetworkState } from 'expo-network';

export type NetworkStatus = {
  /** True only when the OS is sure there is no connection. */
  isOffline: boolean;
};

/**
 * Offline means the OS reports no connection, or a connection with no internet behind it.
 * `undefined` (not known yet, e.g. right after launch) counts as online, so the banner never
 * flashes up at startup on a working connection.
 */
export const isOfflineState = (state: NetworkState) =>
  state.isConnected === false || state.isInternetReachable === false;

/** Whether the device is offline, updated from OS events (expo-network) — never polled. */
export function useNetworkStatus(): NetworkStatus {
  return { isOffline: isOfflineState(useNetworkState()) };
}
