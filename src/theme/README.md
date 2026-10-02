# theme

Design tokens: `colors`, `spacing`, `radii`, `elevation`, `typography`, `durations`/`easings`.
Nothing in `src/` hard-codes a hex, a size or a duration. It comes from here.

**Direction: editorial product catalogue.** Cars are shown the way a design magazine shows objects:
large images, generous whitespace, confident type, minimal chrome. It's deliberately not the blue
corporate rental-app look.

- **Palette.** Near-black ink `#12120F` on warm paper `#FAF8F4`, plus one saturated signal orange
  used sparingly, for primary actions and status only. There is one accent per colour scheme,
  because no single colour reaches 4.5:1 on both paper and ink (the ceiling is ≈4.21:1, proven in
  `__tests__/theme/colors.test.ts`). Light mode uses `#B4460A` (5.18:1 on paper) and dark mode
  uses `#FF7A1A` (7.19:1 on ink).
- **Type.** Schibsted Grotesk, a grotesque drawn for a Scandinavian newsroom. `display` is for car
  names; `label` (small, uppercase, tracked) is for metadata. Pick a style by role from
  `typography`, never by size. Font scaling is never disabled.
- **Shape.** One radius scale (`sm 4 / md 8 / lg 16 / pill`). Surfaces are separated by hairline
  borders, not shadows. `elevation.raised` is the single exception, for floating bars.
- **Space.** A 4pt scale. Be generous: when unsure, use the next step up.
- **Motion.** Short and eased, and it always yields to reduce motion (`useReducedMotion`). See
  `motion.ts` for the durations, easings, `stagger`, `entrance`, `pressSpring` and `shimmer`.
  `opacity.dimmed` only ever dims images, never text.

**Added in PR 7**, without changing any existing value:

- `iconSize` (`sm 16 / md 24 / lg 32`): Ionicons sizes for chips, controls and tabs, and empty
  states.
- `favouritePop`: how far the heart springs when tapped.
- `inputDebounce`: how long typing must pause before the car list filters.

**Added for booking details (A-015)**, without changing any existing value:

- `colors.qr` (`foreground` / `background`): the booking QR is ink on white in **both** schemes.
  Scanners expect dark modules on a light field. The pair has a row in the contrast test.
- `qrCodeSize` (220): the QR's side, quiet zone included. It fits a 320pt screen with padding.
- `typography.code`: a booking code, bold, tracked wide and tabular, so it can be read out.

**Goes here:** values used by more than one component. **Does not go here:** styles for a single
component. Those live in that component's `StyleSheet.create` block.
