---
id: FL-009
date: 2026-09-28
author: Moha
related_interaction: A-010
what_went_wrong: Wrote inline style objects (`{ backgroundColor: colors.status[status] }`, `{ backgroundColor: colors.placeholder }`) in SyncStatusBadge and CarHero, against the AGENTS.md "no inline style objects" rule
how_caught: code review
fix: Moved both into the components' `createStyles(colors)` StyleSheet — per-status entries for the badge, a themed `image` style for the hero
---

# FL-009 — inline style objects despite the rule

## What went wrong

AGENTS.md says: "`StyleSheet.create` at the bottom of the file. No inline style objects." During
[[A-010 details booking flow and context]], Claude Code broke that rule **twice in one session**,
in two different components:

```tsx
// SyncStatusBadge
<View style={[styles.dot, { backgroundColor: colors.status[status] }]} />
// CarHero
style={[styles.image, { backgroundColor: colors.placeholder }]}
```

Both were theme colours chosen at render time. That's exactly the case the project's
`createStyles(colors)` pattern exists for, and the AI had used that pattern correctly in the other
components it wrote the same day.

## How it was caught

The AI caught both on self-review, reading back what it had just written. The second time it also
grepped `src/` for any other inline objects. This is AI self-review, not human review.

Would anything else have caught it? **No.** No lint rule in this project checks for inline styles.
Typecheck and tests don't care. It would have reached the PR, and possibly `main`.

## Fix

- `SyncStatusBadge`: six per-status entries (`pendingDot`, `pendingText`, and so on) in its
  `createStyles`, looked up with ``styles[`${status}Dot`]``. Commit `1cd30d3`.
- `CarHero`: the placeholder colour moved into a themed `image` style. Commit `0d60102`.

## Prevention

- A new AGENTS.md "Lessons learned" entry: the rule is not enforced by lint, so read your own diff
  for `style={[… {` before committing.
- **Recommended, not done:** `eslint-plugin-react-native`'s `no-inline-styles` rule would make this
  mechanical, the same way FL-005 made the `eslint-disable` rule mechanical. It's a new dev
  dependency (v5.0.0, supports ESLint 9), so per AGENTS.md the team should decide with a stated
  reason. The AI didn't add it on its own.
- The one legitimate exception, a value measured at runtime (the details spacer's height), uses a
  memoised object with a comment, not an inline literal.
