import { render, screen } from '@testing-library/react-native';

import App from '../App';

// SafeAreaProvider renders nothing until a native layout event reports the insets, and that
// never happens under Jest. The library's own mock supplies fixed insets instead.
// The mock is a default export, so take `.default` (not the module object).
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

/**
 * Smoke test. It does not assert any feature — it asserts that the app boots:
 * the navigation container mounts and lands on the initial route.
 *
 * Its job is to keep CI green and meaningful from day one, and to fail loudly
 * if someone breaks navigation wiring while doing something unrelated.
 *
 * `findByText`, not `getByText`: App renders nothing until the fonts have loaded,
 * and font loading is asynchronous.
 */
describe('App', () => {
  it('renders the car list as the initial screen', async () => {
    render(<App />);

    expect(await screen.findByText('Cars on Funen')).toBeTruthy();
  });
});
