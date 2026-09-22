---
id: FL-003
date: 2026-09-22
author: Moha
related_interaction: A-003
what_went_wrong: AGENTS.md and CONTRIBUTING.md told contributors to install dev packages with `npx expo install <pkg> -- --save-dev`, which puts SDK-managed packages into dependencies instead of devDependencies
how_caught: manual testing
fix: Instruction corrected to `npx expo install <pkg> --dev` in AGENTS.md and CONTRIBUTING.md, after reproducing both behaviours on a throwaway install.
---

# FL-003 — expo install dev flag puts packages in dependencies

## What went wrong

During [[A-003 project setup scaffolding]], Claude Code installed the test tooling with:

```
npx expo install jest-expo jest @types/jest @testing-library/react-native@^13.3.3 \
  react-test-renderer@19.2.3 prettier eslint-config-prettier -- --save-dev
```

Five of the seven packages landed in `dependencies`, not `devDependencies`. The AI noticed, moved
them by hand, re-ran `npm install`, and reported the workaround in its summary — but then wrote the
_original, broken_ incantation into `AGENTS.md` and `CONTRIBUTING.md` as the rule for the whole team:

> Install Expo-related packages with `npx expo install <pkg>` (add `-- --save-dev` for dev
> dependencies) so versions stay compatible with SDK 57.

So the repo's own agent rules documented a command the same session had just had to work around. Every
teammate and every future agent following that rule would ship test tooling as a runtime dependency.

The split is not random. `-- --save-dev` passes the flag through to `npm install`, but Expo resolves
SDK-managed packages itself and writes them into `dependencies` before npm ever sees the flag. So
packages Expo does not manage (`prettier`, `eslint-config-prettier`) honoured it, and SDK-managed ones
(`jest-expo`, `jest`, `@types/jest`, and the two pinned test packages) did not. A half-working command
is worse than a broken one — it looks fine on a quick check.

The [Expo documentation](https://docs.expo.dev/develop/unit-testing/) uses `--dev`, not
`-- --save-dev`. The AI read that page during the session and still wrote the wrong form into the rules.

## How it was caught

Not by the setup session, which noticed the symptom and fixed only the symptom. It was caught in
[[A-007 ai log backfill]], where [[P4]] required the claim to be reproduced on a throwaway install
before the entry could be written.

Two installs of `expo-constants`, each reverted with `git checkout -- package.json package-lock.json`:

| Command                                         | `dependencies` | `devDependencies` |
| ----------------------------------------------- | -------------- | ----------------- |
| `npx expo install expo-constants -- --save-dev` | `~57.0.19` ❌  | absent            |
| `npx expo install expo-constants --dev`         | absent         | `~57.0.19` ✅     |

Confirmed, and the correct flag identified in the same test.

Would it have been caught otherwise? Not by any automated check — nothing in `npm run check`,
`expo-doctor` or CI cares which section a package sits in. It would have surfaced eventually as
bloated production bundles, or not at all in a ten-day project. Requiring reproduction before writing
the entry is what turned a remembered annoyance into a verified root cause.

## Fix

The instruction now reads `npx expo install <pkg> --dev` in both `AGENTS.md` and `CONTRIBUTING.md`.

The packages themselves were already in the right place — they were moved by hand during
[[A-003 project setup scaffolding]], and `package.json` on `main` is correct. Only the written rule
was wrong.

## Prevention

Added to "Lessons learned / known agent mistakes" in `AGENTS.md`.

The lesson generalises past this one flag: **when an agent works around a problem, it must not then
document the thing it worked around.** The setup session had all the information needed to write the
rule correctly — it had just hit the failure and fixed it — and still wrote down the broken form.
Treat any rule an agent adds to `AGENTS.md` as a claim to be tested, not as a note to be trusted,
especially when that same session hit friction in the area the rule describes.
