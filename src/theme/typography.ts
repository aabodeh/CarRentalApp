// Per-weight imports on purpose: importing from the package root bundles all 12 weights (~1.2 MB).
import { SchibstedGrotesk_400Regular } from '@expo-google-fonts/schibsted-grotesk/400Regular';
import { SchibstedGrotesk_500Medium } from '@expo-google-fonts/schibsted-grotesk/500Medium';
import { SchibstedGrotesk_700Bold } from '@expo-google-fonts/schibsted-grotesk/700Bold';
import type { TextStyle } from 'react-native';

/**
 * Font assets to hand to `useFonts` in App.tsx. The keys become the `fontFamily` names below.
 *
 * Each weight is its own family. Do not set `fontWeight` on top of a custom font: Android then
 * falls back to the system font.
 */
export const fontAssets = {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_700Bold,
};

export const fontFamily = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  bold: 'SchibstedGrotesk_700Bold',
} as const;

/**
 * The type scale. Pick a style by role, not by size. Font scaling is never disabled — these are
 * base sizes, and the OS text-size setting multiplies them (the app must work at 200%).
 */
export const typography = {
  /** Car names on the details screen. Editorial and large. */
  display: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  /** Screen titles and car names in lists. */
  title: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  /** Section headings. */
  heading: { fontFamily: fontFamily.medium, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  /** Metadata labels: "SEATS", "FUEL", "ODENSE C". Small, uppercase, tracked. */
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /** Prices. Tabular figures so amounts line up in lists. */
  price: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  /** A booking code, e.g. "MG8XK2LQ-1". Tracked wide and tabular, so it is easy to read out. */
  code: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  /** Button labels. */
  button: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 20 },
} satisfies Record<string, TextStyle>;
