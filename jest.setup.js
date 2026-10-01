/**
 * Runs before every test file (see the `jest` block in package.json).
 *
 * Keep this file small. It is for global test environment setup only — shared
 * mocks for native modules that every suite needs. Test-specific mocks belong
 * in the test file that needs them.
 *
 * The `jest-expo` preset already mocks the native side of the Expo SDK and React
 * Native. Add to this file only when a mock is genuinely needed — i.e. after a
 * suite has actually failed without it (see AGENTS.md > Lessons learned).
 */

/**
 * Reanimated 4 runs on react-native-worklets, whose native module does not exist under Jest:
 * without this, any suite that imports an animated component fails to load with
 * "Cannot read properties of undefined (reading 'loadUnpackers')".
 * Both lines are the libraries' own documented Jest setup:
 * https://docs.swmansion.com/react-native-worklets/docs/guides/testing/
 * https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/
 */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
require('react-native-reanimated').setUpTests();

/**
 * AsyncStorage's native module does not exist under Jest ("NativeModule: AsyncStorage is null").
 * The library ships an in-memory mock for exactly this; every suite that reaches a repository
 * imports storage, so it is global. Tests reset it with `AsyncStorage.clear()`.
 * https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/**
 * expo-network's `useNetworkState` does not work under Jest: it updates state asynchronously
 * (an act() warning) and its cleanup calls `listener.remove()`, which jest-expo's generic native
 * mock does not provide, so unmounting crashes. Every screen reads the network status, so the
 * default here is "online". A test that needs offline switches it:
 *
 *     jest.mocked(useNetworkState).mockReturnValue({ isConnected: false, isInternetReachable: false });
 *
 * (see __tests__/helpers/network.ts)
 */
jest.mock('expo-network', () => ({
  ...jest.requireActual('expo-network'),
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

/**
 * The Ionicons font, loaded before any test renders, the way App.tsx loads it before the app renders.
 * Without it an icon's first render loads the font itself and then sets state, outside act(): an
 * act() warning in whichever test happens to draw the first icon (seen, not guessed: PR 7).
 * `Font.loadAsync` is jest-expo's mock; it only marks the font as loaded.
 */
beforeAll(() => {
  const { loadAsync } = require('expo-font');
  const Ionicons = require('@expo/vector-icons/Ionicons').default;
  return loadAsync(Ionicons.font);
});

/**
 * Any console.error or console.warn fails the test that produced it.
 *
 * Why: warnings passed silently before — an act() warning (FL-012) and a deprecation warning
 * (FL-011) were only noticed because someone read the output. Now they fail the build.
 *
 * How: messages are *recorded*, and the test fails in afterEach with all of them. Throwing inside
 * console.error itself would not work reliably: React calls it from its own internals, where a
 * throw gets swallowed or turns into an unrelated error. Recording also catches a warning that
 * fires after the test's last assertion — the FL-012 case.
 *
 * OPT-IN for a test that expects a warning: replace the method with a spy, which bypasses the
 * recorder, and assert on it:
 *
 *     const error = jest.spyOn(console, 'error').mockImplementation(() => {});
 *     …
 *     expect(error).toHaveBeenCalledWith(expect.stringContaining('…'));
 */
const unexpectedConsole = [];

for (const level of ['error', 'warn']) {
  const original = console[level];
  console[level] = (...args) => {
    unexpectedConsole.push(`console.${level}: ${args.map(String).join(' ')}`);
    original(...args);
  };
}

afterEach(() => {
  if (unexpectedConsole.length > 0) {
    const messages = unexpectedConsole.splice(0).join('\n\n');
    throw new Error(`Unexpected console output (see jest.setup.js to opt in):\n\n${messages}`);
  }
});
