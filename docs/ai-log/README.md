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

**The course requires at least three failure entries.** Write them when they happen — a log
reconstructed the night before the deadline reads exactly like one reconstructed the night
before the deadline.

## Index — interactions

- [[A-001 project setup scaffolding]] — 2026-09-22 — repo tooling, agent rules, AI dossier, CI

## Index — failures

_None yet. At least three are required by the end of the project._

## Reading this vault in Obsidian

Open the `docs/` folder as an Obsidian vault (**Open folder as vault**). The Templates core
plugin is already pointed at `templates`, so <kbd>Ctrl/Cmd+P</kbd> → _Insert template_ gives
you the two note shapes.

Nothing here depends on a community plugin. If you do have **Dataview** installed, this query
renders the interaction table automatically:

    ```dataview
    TABLE date, author, tool, mode, area, decision, verification
    FROM "ai-log/interactions"
    SORT id ASC
    ```

Without Dataview that block just shows as code, which is why the plain lists above are the
source of truth.
