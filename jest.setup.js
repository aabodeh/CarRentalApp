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
