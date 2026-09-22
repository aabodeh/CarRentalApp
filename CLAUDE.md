@AGENTS.md

## Claude Code specifics

Everything in AGENTS.md applies. These are the Claude-Code-only bits.

### Slash commands

| Command        | What it does                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/log-ai`      | Writes a new `A-###` interaction note in `docs/ai-log/interactions/`. Picks the next free ID, pre-fills what it can from the current session, asks you for the rest, and appends to the index. |
| `/log-failure` | Same, for an `FL-###` note in `docs/ai-log/failures/` — AI output that was wrong or off-spec.                                                                                                  |

Neither command invents the `verification` or `decision` fields. Those record what a human
did; if you have not verified it yet, they stay `TODO`.

### Working agreement

- Run `npm run check` before telling me a task is done. Report the actual output — a failing
  test reported as passing is worse than a failing test.
- Prefer `npx expo install` over `npm install` for anything Expo-related, and say why any new
  dependency is needed.
- When a task produced or changed code that will land in the repo, end by either writing the
  AI log entry or reminding me to run `/log-ai`.
- If you got something materially wrong during a session, say so and suggest `/log-failure`.
  The failure log is graded coursework, not a blame record — an empty one is a worse signal
  than an honest one.
