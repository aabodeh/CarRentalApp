# AI log

The course requires every significant AI interaction to be disclosed and logged. This folder is
that log, kept as notes in git so its history is reviewable.

## Workflow

1. Did AI produce or change something that ended up in the repo? Then it needs an entry.
2. Run `/log-ai` in Claude Code, or copy `docs/templates/ai-interaction.md` by hand.
3. Name the note `A-### short title.md` in `interactions/`, taking the next free number.
4. Fill in `verification` and `decision` **yourself** — an AI must never write those two.
5. If the AI got something wrong, add an `FL-### short title.md` in `failures/` (`/log-failure`).
6. Put the `A-###` ID in the pull request description. The PR template asks for it.
7. Add the note's line to the index below. The slash commands do this for you.

`verification` means what a human actually did: ran the tests, read the diff, tried it on a
device. "It ran" is not verification. `decision` is `kept`, `modified` or `discarded`.

**One AI checking another AI's output is not human verification.** It is useful, and it belongs in
the entry — but label it _AI verification_ and keep it out of the `verification` field.

**The course requires at least three failure entries.** Write them when they happen — a log
reconstructed the night before the deadline reads exactly like one reconstructed the night
before the deadline.

## Index — interactions

Chronological. A-001 to A-007 are from 2026-09-22; A-008 to A-010 are from 2026-09-28; A-011 and A-012 are from 2026-09-29.

| ID                                                  | Tool        | Mode    | Area | What                                                                                                             |
| --------------------------------------------------- | ----------- | ------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| [[A-001 course context and initial setup prompt]]   | Claude chat | chat    | docs | Course context from the Drive materials, repo review, drafting the setup prompt [[P1]]                           |
| [[A-002 setup plan review]]                         | Claude chat | chat    | code | Reviewing Claude Code's setup plan before execution; produced [[P2]]                                             |
| [[A-003 project setup scaffolding]]                 | Claude Code | agentic | code | Tooling, folder skeleton, AGENTS.md, this vault, CI ([PR #1](https://github.com/aabodeh/CarRentalApp/pull/1))    |
| [[A-004 setup review and repo config prompt]]       | Claude chat | chat    | code | Reviewing the setup result; drafting [[P3]]                                                                      |
| [[A-005 repo configuration and expo patch]]         | Claude Code | agentic | code | CI check, branch protection handoff, expo patch ([PR #2](https://github.com/aabodeh/CarRentalApp/pull/2))        |
| [[A-006 ai log backfill prompt]]                    | Claude chat | chat    | docs | Drafting the backfill prompt [[P4]]                                                                              |
| [[A-007 ai log backfill]]                           | Claude Code | agentic | docs | This chronological backfill ([PR #3](https://github.com/aabodeh/CarRentalApp/pull/3))                            |
| [[A-008 domain types design system and dummy data]] | Claude Code | agentic | code | PR 1 foundation: types, tokens, a11y rules, dummy cars ([PR #4](https://github.com/aabodeh/CarRentalApp/pull/4)) |
| [[A-009 car repository hook and list screen]]       | Claude Code | agentic | code | Car list: repository, hooks, motion, a11y ([PR #5](https://github.com/aabodeh/CarRentalApp/pull/5))              |
| [[A-010 details booking flow and context]]          | Claude Code | agentic | code | Details, booking form, BookingContext ([PR #6](https://github.com/aabodeh/CarRentalApp/pull/6))                  |
| [[A-011 api offline cache and banner]]              | Claude Code | agentic | code | API client, offline cache (K1), offline banner ([PR #7](https://github.com/aabodeh/CarRentalApp/pull/7))         |
| [[A-012 retry queue my bookings and tabs]]          | Claude Code | agentic | code | Retry queue (K2), My bookings, tabs, toast (K3) ([PR #9](https://github.com/aabodeh/CarRentalApp/pull/9))        |

## Index — failures

| ID                                                               | From         | What went wrong                                                                                          | Caught by                                               |
| ---------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [[FL-001 stale react native animated mock]]                      | A-003        | Mocked a React Native module path that does not exist in 0.86                                            | The test suite failed to run                            |
| [[FL-002 wrong area for setup log entry]]                        | A-002, A-003 | Filed a tooling session under `area: structure`                                                          | Plan review, before execution                           |
| [[FL-003 expo install dev flag puts packages in dependencies]]   | A-003        | Wrote a broken `npx expo install` flag into AGENTS.md as the team rule                                   | Manual reproduction during A-007                        |
| [[FL-004 font package root bundles every weight]]                | A-008        | Font package root import bundled all 12 weights (~1.2 MB) to use 3                                       | Reading the `expo export` asset list                    |
| [[FL-005 eslint disable written to silence a warning]]           | A-009        | Wrote an `eslint-disable` to silence `exhaustive-deps` instead of fixing the deps                        | AI self-review; no tool would have                      |
| [[FL-006 reanimated value assignment rejected by compiler lint]] | A-009        | Used `sv.value =`, which the React Compiler lint rejects; needs `.get()`/`.set()`                        | Lint                                                    |
| [[FL-007 safe area jest mock used without default]]              | A-009        | Wired the safe-area Jest mock without `.default`, crashing App in tests                                  | The App smoke test                                      |
| [[FL-008 npm install changed more than declared]]                | A-010        | A caret-range install bumped 3 navigation packages and dropped 5 transitive ones                         | Reading the npm output and lockfile diff                |
| [[FL-009 inline style objects despite the rule]]                 | A-010        | Wrote inline style objects twice, against AGENTS.md                                                      | AI self-review; no lint rule                            |
| [[FL-010 merged transforms cancelled the entrance animation]]    | A-010        | Two animated `transform` styles in one array, so the press scale erased the entrance                     | AI self-review; tests were green                        |
| [[FL-011 deprecated datetimepicker onChange from memory]]        | A-010        | Used datetimepicker `onChange`, deprecated in v9 (dev warning)                                           | Reading the library source                              |
| [[FL-012 flaky flatlist act warning shipped in tests]]           | A-009        | CarList tests used real timers; FlatList's deferred render logged an intermittent act() warning, on main | A full run during A-010; reproduced 3/6                 |
| [[FL-013 repository contract not designed for k1]]               | A-009        | Single-shot `Promise<Car[]>` repository contract could not express K1's cache-then-refresh               | Plan-time review in A-011                               |
| [[FL-014 invented support path in copy]]                         | A-011        | Failed-booking copy said "Please contact us"; the app has no contact channel                             | AI self-review; nothing else would have                 |
| [[FL-015 assumed mockapi adds ids to seed]]                      | A-011        | Seed shipped without ids; docs claimed MockAPI adds them. It doesn't, so all 10 cars failed validation   | Checking the real `/cars` reply against the app's guard |
| [[FL-016 report notes stated counts not yet true]]               | A-012        | Report notes gave log counts (12/16) that did not exist yet (11/15)                                      | AI self-review before commit                            |

Add more as they happen.

## Prompts

Long prompts live in `prompts/` and are wiki-linked from the entries that produced and consumed them.

|                                                  | Drafted in     | Used in |
| ------------------------------------------------ | -------------- | ------- |
| [[P1]] — initial setup prompt                    | A-001          | A-003   |
| [[P2]] — plan review changes                     | A-002          | A-003   |
| [[P3]] — repo configuration prompt               | A-004          | A-005   |
| [[P4]] — AI dossier backfill prompt              | A-006          | A-007   |
| [[P5]] — PR 1 foundation prompt                  | pasted by Moha | A-008   |
| [[P6]] — PR 2 car list prompt                    | pasted by Moha | A-009   |
| [[P7]] — PR 3 booking flow prompt                | pasted by Moha | A-010   |
| [[P8]] — PR 4 API and offline prompt             | pasted by Moha | A-011   |
| [[P9]] — PR 5 retry queue and My bookings prompt | pasted by Moha | A-012   |

## Reading this vault in Obsidian

Open the **`docs/` folder itself** as an Obsidian vault (_Open folder as vault_) — not a subfolder,
or the wikilinks will not resolve and you will get a second `.obsidian/` directory. The
Templates core plugin is already pointed at `templates`, so <kbd>Ctrl/Cmd+P</kbd> → _Insert template_
gives you the two note shapes.

Nothing here depends on a community plugin. If you do have **Dataview** installed, this query
renders the interaction table automatically:

    ```dataview
    TABLE date, author, tool, mode, area, decision, verification
    FROM "ai-log/interactions"
    SORT id ASC
    ```

Without Dataview that block just shows as code, which is why the plain tables above are the
source of truth.
