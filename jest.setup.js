/**
 * Runs before every test file (see the `jest` block in package.json).
 *
 * Keep this file small. It is for global test environment setup only — shared
 * mocks for native modules that every suite needs. Test-specific mocks belong
 * in the test file that needs them.
 */

// Silence the RN animation helper warning that fires when a navigator mounts
// under Jest. Harmless, but it buries real failures in noise.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});
