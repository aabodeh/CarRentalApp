import { StyleSheet } from 'react-native';

/**
 * Elevation approach: surfaces are separated by a hairline border, not a shadow.
 * `raised` is the single exception, reserved for things that float above scrolling content
 * (a sticky booking bar, a toast). The shadow colour is `ink` (#12120F) at 12% opacity.
 */
export const elevation = {
  flat: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  raised: {
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0px 8px 24px rgba(18, 18, 15, 0.12)',
  },
} as const;
