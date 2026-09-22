---
description: Log an AI interaction as an A-### note in the AI dossier
allowed-tools: Bash(ls:*), Bash(git log:*), Bash(git branch:*), Bash(git diff:*), Bash(gh pr view:*), Read, Write, Edit, AskUserQuestion
---

Write a new AI interaction note in `docs/ai-log/interactions/`.

Optional context from the user: $ARGUMENTS

## Steps

1. **Pick the ID.** Run `ls docs/ai-log/interactions/` and take the next free `A-###`
   (zero-padded to three digits). If the folder is empty, start at `A-001`. Never reuse an ID.

2. **Read the template** at `docs/templates/ai-interaction.md` and follow its exact frontmatter
   key order. Do not invent extra keys.

3. **Pre-fill what you can actually observe** from this session — never from imagination:
   - `date`: today's date, `YYYY-MM-DD`.
   - `author`: the git user (`git config user.name`).
   - `tool`: `Claude Code`.
   - `mode`: `agentic` if you used tools to edit files, `chat` if it was discussion only.
   - `area`: one of `strategy | scope | structure | skeleton | surface | code | tests | docs`,
     based on what the work actually touched. Tooling and infrastructure count as `code`;
     `structure` is reserved for design-document work (navigation model, data model).
   - `task`: one line, what was asked for.
   - `prompt_or_link`: the user's prompt for this session. If it was long, summarise it in two
     or three sentences and say it is a summary.
   - `related_pr`: the PR number if you can find one (`gh pr view --json number` on the current
     branch); otherwise leave blank.
   - **Body — Prompt** and **Output summary**: fill these in from the session. Be concrete
     about which files changed. If the AI assumed something it was not told, say so.

4. **Never invent `verification` or `decision`.** These describe what a _human_ did.
   - Ask the user whether they have verified the work yet, and what they decided
     (`kept` / `modified` / `discarded`).
   - If they have not verified it, write `TODO` for both and tell them plainly that the entry
     is incomplete until a human fills them in.
   - The same applies to the **Evaluation** and **Alternatives considered without AI** body
     sections. Ask. If the user has no answer yet, leave a `TODO` line explaining what is
     missing — do not fabricate an evaluation of your own work, and do not invent
     "alternatives the team looked up", because you cannot know what they looked up.

5. **Ask for anything still missing** using `AskUserQuestion`, one focused question at a time.
   Only ask for fields you genuinely cannot observe.

6. **Write the note** to `docs/ai-log/interactions/A-### <short title>.md`. The title is three
   to six lowercase words describing the task, with spaces (this is an Obsidian vault; spaces
   in filenames are fine and make `[[wikilinks]]` readable).

7. **Update the index.** Append a line to the `## Index — interactions` list in
   `docs/ai-log/README.md`:
   `- [[A-### short title]] — YYYY-MM-DD — <one-line summary>`
   Keep it sorted by ID.

8. **Report back**: the path written, and explicitly which fields are still `TODO` and who
   needs to fill them in.

## Rules

- One note per interaction. If the user asks to log something already logged, update the
  existing note rather than creating a duplicate.
- Do not log trivial autocompletion. "Significant" means it produced or changed code,
  architecture, tests or docs that ended up in the repo.
- Keep the note honest. This log is graded on whether it reflects what actually happened.
