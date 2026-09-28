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
  `motion.ts`.

**Goes here:** values used by more than one component. **Does not go here:** styles for a single
component. Those live in that component's `StyleSheet.create` block.
