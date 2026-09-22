---
id: A-003
date: 2026-09-22
author: Moha
tool: Claude Code (Claude Opus 5)
mode: agentic
area: code
task: Project setup — tooling, folder skeleton, AGENTS.md, AI log vault, CI, docs
prompt_or_link: '[[P1]], then [[P2]] after plan review'
verification: Reviewed and approved by a teammate before merge; CI passed. (Provided by Moha.)
decision: modified
related_pr: https://github.com/aabodeh/CarRentalApp/pull/1
---

# A-003 — project setup scaffolding

> Renumbered from `A-001` to `A-003` in [[A-007 ai log backfill]] when the dossier was put in
> chronological order. Moved with `git mv` so the file's history is preserved.

## Prompt

[[P1]] — the initial setup prompt, drafted in [[A-001 course context and initial setup prompt]].

Claude Code was asked to start in plan mode. After it presented its plan, that plan was reviewed in
[[A-002 setup plan review]] and [[P2]] was sent, approving it with four changes. Only then did
execution begin.

Two decisions were put back to the human during planning and answered by Moha, not by the AI:

- tests live in a top-level `__tests__/` mirroring `src/`, not co-located;
- the architecture rule is enforced as a lint error, not documented only.

The prompt was itself drafted with Claude chat — see [[A-001 course context and initial setup prompt]].

## Output summary

Six commits on `chore/project-setup`, merged as PR #1:

1. **Tooling.** ESLint via `npx expo lint` (`eslint-config-expo` flat config) plus
   `eslint-config-prettier`; `@typescript-eslint/no-explicit-any` as an error; an architecture
   guardrail on `src/screens/**` and `src/components/**` banning `fetch`/`XMLHttpRequest`, imports
   from `services/`, `storage/`, `data/`, and direct `async-storage`/`expo-sqlite` imports.
   `.prettierrc`, `.prettierignore`, `strict: true` kept, Jest with the `jest-expo` preset, and the
   `lint`/`format`/`typecheck`/`test`/`check` scripts.
2. **Folder skeleton.** `src/{components,hooks,repositories,services/api,storage,data/dummy,types,theme,utils}`
   and `__tests__/`, each with a README stating what belongs there and what does not, including where
   K1/K2/K3 will live. No domain types written.
3. **Smoke test.** `__tests__/App.test.tsx` renders `<App />` and asserts the initial route.
4. **Agent rules.** `AGENTS.md` rewritten; `CLAUDE.md` reduced to `@AGENTS.md` plus Claude-Code specifics.
5. **AI dossier.** This vault: templates, `README.md` workflow and index, `.obsidian/` config pointing
   Templates at `templates`, `/log-ai` and `/log-failure` commands, and the first entry.
6. **CI and collaboration.** `.github/workflows/ci.yml`, PR template, `CONTRIBUTING.md`, README.

Packages added, all dev dependencies: `jest-expo ~57.0.5`, `jest ~29.7.0`, `@types/jest 29.5.14`,
`@testing-library/react-native ^13.3.3`, `react-test-renderer 19.2.3`, `prettier ^3.9.8`,
`eslint-config-prettier ^10.1.8`, `eslint ^9`, `eslint-config-expo ~57.0.2`. No runtime dependency
was added.

One assumption the AI made without being told: Node 22 in CI (SDK 57 requires ≥22.13.x, and the dev
machine runs v22.22.1).

Two failures came out of this session: [[FL-001 stale react native animated mock]] and
[[FL-003 expo install dev flag puts packages in dependencies]].

## Evaluation

**Decision — modified.** _(Provided by Moha.)_ The plan was reviewed before execution and four
changes were requested: drop `noUncheckedIndexedAccess`, drop `eslint-plugin-prettier`, restrict
`@react-native-async-storage/async-storage` and `expo-sqlite` imports in screens/components, and fix
this entry's `area` from `structure` to `code`.

**Human verification** _(provided by Moha):_ the PR was reviewed and approved by a teammate before
merge, and CI passed.

**AI verification — not human verification.** Claude chat independently cloned the branch, ran
`npm ci` and `npm run check` (all green, 1 test passing) and inspected `eslint.config.js`, `ci.yml`
and `AGENTS.md`. This was one AI checking another AI's output and is recorded as such; it does not
substitute for the human review above.

**Facts from the session, for the reviewer to weigh:**

- The architecture guardrail was verified to fire rather than assumed to: a throwaway file under
  `src/screens/` triggered all four rules before the rule was committed.
- The first `jest.setup.js` mocked an API that does not exist in React Native 0.86 — see
  [[FL-001 stale react native animated mock]].
- The AI committed three unformatted READMEs; `format:check` caught it and the commit was amended.
- It chose `@testing-library/react-native` 13.x over 14.x deliberately: v14 requires `test-renderer@^1`
  and jest-30 utilities, which conflict with `jest-expo`'s jest-29 toolchain.

Anything beyond the above: TODO (Moha).

## Alternatives considered without AI

TODO (Moha)

Suggested sources to check before signing this off:

- the Expo docs on [ESLint](https://docs.expo.dev/guides/using-eslint/) and
  [unit testing](https://docs.expo.dev/develop/unit-testing/), against the config committed here;
- the SDK 57 [version page](https://docs.expo.dev/versions/v57.0.0/) for the Node requirement used in CI;
- whether other teams on the course use co-located tests instead of a top-level `__tests__/`.
