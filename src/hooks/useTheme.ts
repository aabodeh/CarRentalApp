import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorTokens } from '../theme';

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
};

/**
 * The colour set for the current OS appearance. Spacing, radii and typography do not change
 * between schemes, so import those straight from src/theme.
 *
 * While app.json sets `userInterfaceStyle: "light"`, the OS always reports light, so the dark
 * tokens are defined and tested but not yet shown.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: scheme === 'dark' ? darkColors : lightColors };
}
