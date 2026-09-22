---
description: Log AI output that was wrong or off-spec as an FL-### note
allowed-tools: Bash(ls:*), Bash(git log:*), Bash(git diff:*), Read, Write, Edit, AskUserQuestion
---

Write a new AI failure note in `docs/ai-log/failures/`.

Optional context from the user: $ARGUMENTS

## Steps

1. **Pick the ID.** Run `ls docs/ai-log/failures/` and take the next free `FL-###`
   (zero-padded to three digits). Start at `FL-001`. Never reuse an ID.

2. **Read the template** at `docs/templates/ai-failure.md` and follow its exact frontmatter
   key order.

3. **Pre-fill what you can observe:**
   - `date`: today's date, `YYYY-MM-DD`.
   - `author`: the git user (`git config user.name`).
   - `related_interaction`: the `A-###` this came out of. Check
     `ls docs/ai-log/interactions/` and ask the user if it is ambiguous. Leave blank if the
     failure did not come from a logged interaction.
   - `what_went_wrong`: one line. Be concrete about the actual defect — name the API that did
     not exist, the rule that was violated, the test that broke.
   - `how_caught`: one of `test | CI | code review | manual testing | typecheck | lint`.
     Ask the user if you do not know; do not guess, because how it was caught is the whole
     point of the entry.
   - `fix`: one line, what was done instead.

4. **Fill the body sections** — _What went wrong_, _How it was caught_, _Fix_, _Prevention_.
   In _How it was caught_, answer the interesting question honestly: would this have been
   caught if that check did not exist? In _Prevention_, say whether this should become an
   AGENTS.md "Lessons learned" entry, a lint rule, or a test.

5. **Do not soften it.** If the failure was yours, describe it plainly. An honest failure log
   is graded coursework; a flattering one is worth less than an empty one. Equally, do not
   invent a failure to pad the count — if the user asks you to log something that did not
   happen, say so.

6. **Ask for anything missing** with `AskUserQuestion`, one focused question at a time.

7. **Write the note** to `docs/ai-log/failures/FL-### <short title>.md`, the title being three
   to six lowercase words.

8. **Update the index.** Append to the `## Index — failures` list in `docs/ai-log/README.md`
   (replacing the "None yet" placeholder if it is still there):
   `- [[FL-### short title]] — YYYY-MM-DD — <one-line summary>`

9. **If Prevention says so, do it now:** append the lesson to the
   "Lessons learned / known agent mistakes" section of `AGENTS.md`, linking the `FL-###` note.
   That section growing over time is exactly the evidence the course is looking for.

10. **Report back**: the path written, and whether AGENTS.md was updated.
