import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { useTheme } from '../../src/hooks/useTheme';
import { darkColors, lightColors } from '../../src/theme';

describe('useTheme', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the light colours when the device is in light mode', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');

    const { result } = renderHook(() => useTheme());

    expect(result.current.colors).toBe(lightColors);
    expect(result.current.scheme).toBe('light');
  });

  it('returns the dark colours when the device is in dark mode', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.colors).toBe(darkColors);
    expect(result.current.scheme).toBe('dark');
  });

  it('falls back to light when the device reports no preference', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('unspecified');

    const { result } = renderHook(() => useTheme());

    expect(result.current.colors).toBe(lightColors);
  });
});
