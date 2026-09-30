---
id: FL-017
date: 2026-09-30
author: Moha
related_interaction: A-013
what_went_wrong: Committed a new test file in the same shell command that ran `tsc`, chained with `;` instead of `&&`, so the commit went through although typecheck had failed with three errors (`Cannot find name 'fs'`, `'path'`, `'__dirname'`)
how_caught: typecheck
fix: Typed the two `fs` functions through `jest.requireActual<…>` (no @types/node dependency), re-ran lint, typecheck and tests separately, then amended the unpushed commit only after `npm run check` passed, chained with `&&`
---

# FL-017 — committed before reading the check

## What went wrong

During [[A-013 hand-in preparation]], Claude Code wrote
`__tests__/docs/requirementsCoverage.test.ts` and ran one command:

```
npx eslint … && npx tsc --noEmit 2>&1 | head -3; git add … && git commit …
```

The `;` before `git add` means "run this whatever happened before". `tsc` printed three errors:
the test imported Node's `fs` and `path`, and this project does not depend on `@types/node`. The
commit was created anyway. The errors were read only afterwards, in the same output.

**This is the second time.** In [[A-012 retry queue my bookings and tabs]] the bottom-tabs commit
was made in the same command as `expo-doctor`, whose output said "1 check failed". That time it
was recorded only as a note inside A-012. It should have been a failure entry and a rule then.

## How it was caught

By reading the command's own output: the `tsc` errors were printed above the commit hash. Nothing
was pushed.

Would it have been caught otherwise? Yes. `npm run check` fails on type errors, and so does CI,
so it could not have been merged. The cost would have been a red CI run on a pushed branch and a
fix-up commit. The real problem is the habit: a commit should be the _result_ of a passing check,
not something that happens next to one.

## Fix

- The test now loads `fs` through `jest.requireActual<{ existsSync…; readFileSync… }>('fs')`,
  typing only the two functions it uses, and resolves paths from the repo root. No new dependency.
- Lint, typecheck and the test were re-run as separate commands and read.
- The commit was amended with `npm run check && … git commit --amend`, so it could only happen
  if the check passed. It had not been pushed.

## Prevention

A new AGENTS.md "Lessons learned" entry: **a commit is chained to its check with `&&`, never
`;`**, and the check is the full `npm run check`, not one tool.
