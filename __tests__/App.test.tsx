import { render, screen } from '@testing-library/react-native';

import App from '../App';

/**
 * Smoke test. It does not assert any feature — it asserts that the app boots:
 * the navigation container mounts and lands on the initial route.
 *
 * Its job is to keep CI green and meaningful from day one, and to fail loudly
 * if someone breaks navigation wiring while doing something unrelated.
 */
describe('App', () => {
  it('renders the car list as the initial screen', () => {
    render(<App />);

    expect(screen.getByText('Car List')).toBeTruthy();
  });
});
