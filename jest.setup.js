/**
 * Runs before every test file (see the `jest` block in package.json).
 *
 * Keep this file small. It is for global test environment setup only — shared
 * mocks for native modules that every suite needs. Test-specific mocks belong
 * in the test file that needs them.
 *
 * It is intentionally empty right now: the `jest-expo` preset already mocks the
 * native side of the Expo SDK and React Native. Add to it only when a mock is
 * genuinely needed by every suite.
 */

export {};
