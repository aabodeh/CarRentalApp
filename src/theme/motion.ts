/**
 * Motion rules. Motion is feedback and orientation, not decoration: short, and eased so it starts
 * fast and settles.
 *
 * ACCESSIBILITY: every animation must degrade to no animation when the user has turned on
 * "Reduce motion" (iOS) / "Remove animations" (Android). Read `useReducedMotion()` from
 * src/hooks and use a duration of 0, or skip the animation, when it returns true. This is a
 * requirement, not an option — see AGENTS.md > Motion and accessibility.
 */

/** Durations in milliseconds. */
export const durations = {
  /** Press feedback, toggles. */
  fast: 150,
  /** Most transitions: fades, a card expanding. */
  base: 250,
  /** Larger movements: a sheet sliding in, a shared image. */
  slow: 400,
} as const;

/**
 * Cubic-bezier control points. Tuples so they work with both Reanimated
 * (`Easing.bezier(...easings.standard)`) and React Native's Animated.
 */
export const easings = {
  /** Default for anything that moves on screen. */
  standard: [0.2, 0, 0, 1],
  /** Elements arriving: decelerate into place. */
  enter: [0, 0, 0.2, 1],
  /** Elements leaving: accelerate away. */
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Scale applied to a pressed card or button. Subtle on purpose. */
export const pressScale = 0.97;

/**
 * List entrance: cards fade in and rise by `distance` points, one after another. Only the first
 * `maxItems` stagger — the last one starts at (maxItems − 1) × step = 300 ms. Cards that mount
 * later while scrolling appear without an entrance, because a card fading in mid-scroll reads as lag.
 */
export const stagger = { step: 60, maxItems: 6 } as const;
export const entrance = { distance: 12 } as const;

/** Spring for press feedback: quick and settled, no visible wobble. Reanimated `withSpring` config. */
export const pressSpring = { damping: 20, stiffness: 300, mass: 1 } as const;

/** Skeleton pulse: opacity swings between 1 and `minOpacity` every `duration` ms, then back. */
export const shimmer = { duration: 900, minOpacity: 0.4 } as const;
