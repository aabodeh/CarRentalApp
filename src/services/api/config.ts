import Constants from 'expo-constants';

/**
 * Where the API lives. The URL is configuration, not code: it comes from `extra.apiBaseUrl` in
 * app.json, so pointing the app at another server never needs a code change.
 *
 * An object with a method (rather than a bare function export) so tests can stub it with
 * `jest.spyOn(apiConfig, 'baseUrl')`.
 */
export const apiConfig = {
  /** The base URL without a trailing slash, or null when none is configured. */
  baseUrl(): string | null {
    const value: unknown = Constants.expoConfig?.extra?.apiBaseUrl;
    if (typeof value !== 'string' || value.trim() === '') return null;
    return value.trim().replace(/\/+$/, '');
  },
};
