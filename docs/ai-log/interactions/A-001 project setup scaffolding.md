---
id: A-001
date: 2026-09-22
author: Mohamed Ech-Chantoufy Aourram
tool: Claude Code
mode: agentic
area: code
task: Set up repo infrastructure and conventions — agent rules, AI dossier, lint/format/test tooling, folder skeleton, CI
prompt_or_link: See "Prompt" below. The prompt itself was drafted with Claude (chat) before being given to Claude Code.
verification: TODO # human reviewer: what did you actually run and read?
decision: TODO # human reviewer: kept | modified | discarded
related_pr:
---

# A-001 — project setup scaffolding

## Prompt

A long, detailed setup brief covering: rewrite `AGENTS.md` as a real agent rules file; build the
AI dossier as an Obsidian vault under `docs/` with templates, `/log-ai` and `/log-failure` slash
commands; add ESLint + Prettier + strict TypeScript + Jest with a smoke test and `npm run check`;
create the folder skeleton for a screens → hooks/context → repositories → data sources
architecture; add CI, a PR template, `CONTRIBUTING.md` and a README update. Explicitly **no app
features**, and no domain types — those come from the design document's class diagram.

Standing constraints in the brief: Expo SDK 57 is newer than the model's training data, so read
<https://docs.expo.dev/versions/v57.0.0/> and install with `npx expo install`; keep everything
lightweight for an 2026-10-02 deadline; work on `chore/project-setup` in small Conventional
Commits; do not merge.

**The prompt was itself drafted with Claude (chat)** before this agentic session — that drafting
counts as AI use and is disclosed here rather than logged separately.

Two decisions were put back to the human during planning and answered by them, not by the AI:

- tests live in a top-level `__tests__/` mirroring `src/`, not co-located;
- the architecture rule is enforced as a lint error, not documented only.

The human then amended the plan on review: drop `noUncheckedIndexedAccess`, drop
`eslint-plugin-prettier`, also restrict `@react-native-async-storage/async-storage` and
`expo-sqlite` imports, set this note's `area` to `code` rather than `structure`, and add a
`concurrency` block to the CI workflow.

## Output summary

Six commits on `chore/project-setup`:

1. **Tooling.** ESLint via `npx expo lint` (`eslint-config-expo` flat config) plus
   `eslint-config-prettier`; `@typescript-eslint/no-explicit-any` as an error; an architecture
   guardrail on `src/screens/**` and `src/components/**` banning `fetch`/`XMLHttpRequest`,
   imports from `services/`, `storage/`, `data/`, and direct `async-storage`/`expo-sqlite`
   imports. `.prettierrc`, `.prettierignore`, `strict: true` kept, Jest with the `jest-expo`
   preset, and the `lint`/`format`/`typecheck`/`test`/`check` scripts.
2. **Folder skeleton.** `src/{components,hooks,repositories,services/api,storage,data/dummy,types,theme,utils}`
   and `__tests__/`, each with a README stating what belongs there and what does not, including
   where K1/K2/K3 will live. No domain types written.
3. **Smoke test.** `__tests__/App.test.tsx` renders `<App />` and asserts the initial route.
4. **Agent rules.** `AGENTS.md` rewritten; `CLAUDE.md` reduced to `@AGENTS.md` plus Claude-Code
   specifics.
5. **AI dossier.** This vault: templates, `README.md` workflow and index, `.obsidian/` config
   pointing Templates at `templates`, `/log-ai` and `/log-failure` commands, and this note.
6. **CI and collaboration.** `.github/workflows/ci.yml`, PR template, `CONTRIBUTING.md`, README.

Packages added, all dev dependencies, resolved through `npx expo install`: `jest-expo ~57.0.5`,
`jest ~29.7.0`, `@types/jest 29.5.14`, `@testing-library/react-native ^13.3.3`,
`react-test-renderer 19.2.3`, `prettier ^3.9.8`, `eslint-config-prettier ^10.1.8`,
`eslint ^9`, `eslint-config-expo ~57.0.2`. No runtime dependency was added.

One assumption the AI made without being told: Node 22 in CI (SDK 57 requires ≥22.13.x, and the
dev machine runs v22.22.1).

## Evaluation

Facts, for the reviewer to judge:

- The architecture guardrail was verified to fire, not assumed to: a throwaway file under
  `src/screens/` triggered all four rules (`fetch`, the `services/**` pattern, the
  `async-storage` package import, and `no-explicit-any`) before the rule was committed.
- The AI's first `jest.setup.js` mocked
  `react-native/Libraries/Animated/NativeAnimatedHelper`, a path that no longer exists in
  React Native 0.86. It failed the suite outright and was removed. This is the exact class of
  mistake the brief warned about — reaching for a remembered Expo/RN API instead of the v57
  docs — and it is worth an `FL-###` note.
- The AI initially committed three unformatted READMEs; `format:check` caught it and the commit
  was amended.
- It chose `@testing-library/react-native` 13.x over the newer 14.x deliberately: v14 requires
  `test-renderer@^1` and jest-30 utilities, which conflict with `jest-expo`'s jest-29 toolchain.

TODO — human reviewer: your own assessment of how well the AI did. Did the conventions in
`AGENTS.md` match what the team actually wants? Is anything over-engineered for ten days?

## Alternatives considered without AI

TODO — human reviewer. The course requires this section to record what the team looked up
independently. Suggested things to check against a non-AI source before signing this off:

- the Expo docs on [ESLint](https://docs.expo.dev/guides/using-eslint/) and
  [unit testing](https://docs.expo.dev/develop/unit-testing/), against the config committed here;
- the SDK 57 [version page](https://docs.expo.dev/versions/v57.0.0/) for the Node requirement
  used in CI;
- whether other teams on the course use co-located tests instead of a top-level `__tests__/`,
  and whether that changed their minds.

Do not leave this as `TODO` at hand-in — an AI cannot know what you looked up.
