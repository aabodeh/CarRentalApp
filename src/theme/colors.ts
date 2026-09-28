import type { SyncStatus } from '../types';

/**
 * Colour tokens. Light and dark share the same keys so a component never branches on the scheme —
 * it asks `useTheme()` for the current set.
 *
 * Every text/background pair here is measured against WCAG AA in
 * `__tests__/theme/colors.test.ts`. Change a value, and that test tells you whether it still passes.
 */
export type ColorTokens = {
  /** App background: warm paper in light mode, ink in dark mode. */
  background: string;
  /** Cards and sheets that sit on the background. */
  surface: string;
  /** Primary text. */
  text: string;
  /** Secondary text and metadata labels. ≥ 4.5:1 on background and surface. */
  textMuted: string;
  /**
   * Decorative 1px dividers and card edges. Below 3:1 on purpose: never the only thing that
   * shows where a control is.
   */
  hairline: string;
  /** Borders of interactive controls (inputs, outlined buttons). ≥ 3:1, per WCAG 1.4.11. */
  borderStrong: string;
  /** The one saturated colour. Primary actions and status only — use sparingly. */
  accent: string;
  /** Text and icons placed on an accent fill. */
  onAccent: string;
  /** K3 sync status. Always pair with a label or icon, never colour alone. */
  status: Record<SyncStatus, string>;
};

const ink = '#12120F';
const paper = '#FAF8F4';

export const lightColors: ColorTokens = {
  background: paper,
  surface: '#FFFFFF',
  text: ink,
  textMuted: '#5F5A51',
  hairline: '#E6E1D8',
  borderStrong: '#8C8579',
  // Burnt signal orange. A brighter orange (#FF6A00) is only 2.7:1 on paper.
  accent: '#B4460A',
  onAccent: '#FFFFFF',
  status: {
    pending: '#8A5300',
    failed: '#B42318',
    completed: '#1F7A3A',
  },
};

export const darkColors: ColorTokens = {
  background: ink,
  surface: '#1E1D1A',
  text: paper,
  textMuted: '#A9A398',
  hairline: '#2C2A26',
  borderStrong: '#7A746A',
  // Brighter signal orange: the light-mode accent is only 3.4:1 on ink.
  accent: '#FF7A1A',
  onAccent: ink,
  status: {
    pending: '#F2B24C',
    failed: '#FF8A7A',
    completed: '#6FD08C',
  },
};

export const colors = { light: lightColors, dark: darkColors };
