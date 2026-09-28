/** 4pt spacing scale. Use these for padding, margin and gap — never a raw number. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

/** Minimum width and height of anything tappable (Apple HIG / WCAG 2.5.8 target size). */
export const minTouchTarget = 44;
