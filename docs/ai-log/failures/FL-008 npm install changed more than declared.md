---
id: FL-008
date: 2026-09-28
author: Moha
related_interaction: A-010
what_went_wrong: '`npm install @react-navigation/elements@^2.9.41` upgraded @react-navigation/core, elements and native by a patch each and removed five transitive packages, though the plan said the step would only declare the version already installed'
how_caught: manual testing
fix: Reverted package.json and the lockfile, ran npm ci, then installed the exact version (`@2.9.41`); the lockfile diff was then only the one intended package
---

# FL-008 — npm install changed more than declared

## What went wrong

The plan for [[A-010 details booking flow and context]] said that `@react-navigation/elements`
would become a direct dependency "at the version native-stack already uses, so no duplicate is
installed". Claude Code ran:

```
npm install "@react-navigation/elements@^2.9.41"
```

With a caret range, npm resolves to the newest matching version, 2.9.43, and then re-resolves
anything that depends on it. The result was "removed 5 packages, changed 3 packages":

- `@react-navigation/core` 7.22.0 → 7.22.1
- `@react-navigation/elements` 2.9.41 → 2.9.43
- `@react-navigation/native` 7.4.0 → 7.4.1
- `query-string` and four of its dependencies were dropped

All of these were within semver, so they were probably harmless. But it was **not what the plan
said**, and navigation upgrades would have been hidden inside a commit titled "declare a
dependency".

## How it was caught

The AI read the npm output ("removed 5 … changed 3") and then diffed the lockfile.

Would anything else have caught it? **No.** `npm run check`, `expo-doctor` and CI all pass either
way. A reviewer would only have seen it by reading `package-lock.json` line by line, which nobody
does for a one-line dependency change.

## Fix

The AI restored `package.json` and `package-lock.json` from git and ran `npm ci`. It then ran
`npx expo install` for the datepicker again, and `npm install @react-navigation/elements@2.9.41`,
with an exact version. After that, the lockfile diff was only the new datepicker entry, and
`npm ls` showed `elements@2.9.41 deduped`. Commit `42f5623`.

## Prevention

A new AGENTS.md "Lessons learned" entry: after any install, read the lockfile diff
(`git diff package-lock.json | grep '"version"'`) and confirm that only the packages you meant to
change moved.
