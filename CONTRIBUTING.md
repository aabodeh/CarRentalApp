# Contributing

Six people work in this repo. These rules exist so that we do not spend the last week untangling
each other's history — and because the course grades our process, not just the app.

Read [AGENTS.md](AGENTS.md) first: it has the architecture, the conventions and the Definition
of Done. This file is about the mechanics.

## The short version

```bash
git switch main && git pull
git switch -c feat/car-list-screen
# ... work ...
npm run check          # must pass before you push
git push -u origin feat/car-list-screen
# open a PR, fill in the template, get a teammate to review
```

## Never push to `main`

Not once, not for a typo. Every change goes through a pull request that CI has checked and a
teammate has approved. This is a course requirement for AI-generated code and a sanity
requirement for everything else.

## Branch naming

`<type>/<short-kebab-description>`, where type is one of:

| Prefix   | For                                            |
| -------- | ---------------------------------------------- |
| `feat/`  | a new feature                                  |
| `fix/`   | a bug fix                                      |
| `chore/` | tooling, dependencies, config, housekeeping    |
| `docs/`  | documentation, the AI log, the design document |

Examples: `feat/booking-form`, `fix/car-list-empty-state`, `chore/upgrade-expo`.

One branch per piece of work. A branch that does three unrelated things is a branch nobody can
review properly.

## Commits — Conventional Commits

```
<type>(<optional scope>): <short imperative summary>

<optional body: why, not what — the diff already says what>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `ci`.

```
feat(booking): add date range picker to the booking form
fix(car-list): show the empty state when the repository returns no cars
test(repositories): cover the offline fallback in carRepository
```

Keep the summary under ~72 characters, in the imperative ("add", not "added"). Commit small and
often — it is much easier to review five focused commits than one that touches thirty files.

## Before you push

```bash
npm run check
```

This runs lint, format check, typecheck and the test suite — the same four things CI runs. If it
fails locally it will fail in CI, so save yourself the round trip.

Useful individually:

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run lint`         | ESLint, including the architecture guardrail |
| `npm run lint:fix`     | ESLint with autofix                          |
| `npm run format`       | Prettier, writing changes                    |
| `npm run format:check` | Prettier, checking only (what CI runs)       |
| `npm run typecheck`    | `tsc --noEmit`                               |
| `npm run test`         | Jest in watch mode, for while you work       |
| `npm run test:ci`      | Jest once with coverage (what CI runs)       |

## Pull requests

- Fill in the template. All of it — including the AI section.
- **The reviewer must not be the author.** If AI generated the code, the reviewer must be a
  teammate who did not generate it. "The model wrote it and it ran" is not a review.
- Review for whether you could explain the code to the lecturer, not just whether it works. Any
  of us can be asked to live-modify any line.
- **Squash-merge**, always. One PR becomes one commit on `main`, so the history stays readable.
- Delete the branch after merging.

## Logging AI use

Every significant AI interaction gets a note in `docs/ai-log/interactions/`. Significant means it
produced or changed code, architecture, tests or docs that ended up in the repo.

In Claude Code:

```
/log-ai
```

It picks the next free `A-###`, pre-fills what it can see from the session, and asks you for the
rest. Using another tool, copy `docs/templates/ai-interaction.md` by hand.

**You fill in `verification` and `decision` yourself.** An AI must never write those — they
record what a human did. `verification` is what you actually ran and read; `decision` is `kept`,
`modified` or `discarded`.

When an AI gets something wrong, log it:

```
/log-failure
```

The course requires **at least three failure entries** for the project. Write them as they
happen. A failure log assembled the night before hand-in looks exactly like one assembled the
night before hand-in.

Put the `A-###` ID in the PR description.

Full workflow: [`docs/ai-log/README.md`](docs/ai-log/README.md).

## Adding a dependency

- Install Expo-related packages with `npx expo install <pkg>` (add `-- --save-dev` for dev
  dependencies) so the version stays compatible with SDK 57. Do not hand-edit versions.
- Justify it in the PR description: what it does, why the standard library or something we
  already depend on is not enough, and roughly how big it is.
- One new dependency per PR where possible, so it can be discussed on its own.

## Keeping AGENTS.md alive

When an agent gets something wrong in a way that will repeat, add it to the
"Lessons learned / known agent mistakes" section of [AGENTS.md](AGENTS.md) and link the `FL-###`
note. That file's git history is graded evidence that we learned something — a file that never
changed says we did not.
