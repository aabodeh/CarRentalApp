## What changed

<!-- One or two sentences. What does this PR do, and why? -->

## How to test it

<!-- What should the reviewer run or tap to see this working? -->

## Tests added

<!-- Which tests, and which acceptance criteria from the design document they map to.
     If no test was added, say why — "it's only config" is sometimes true. -->

## AI used?

- [ ] No AI was used in this change.
- [ ] AI was used. Log entries: `A-___`<!-- , A-___ -->

<!-- Every significant AI interaction needs an entry in docs/ai-log/interactions/.
     Run /log-ai in Claude Code, or copy docs/templates/ai-interaction.md.
     If the AI got something wrong along the way, add an FL-### note too. -->

If AI was used, confirm:

- [ ] I verified the output myself — I ran it, read it, and can explain every line.
- [ ] The `verification` and `decision` fields in the log entry are filled in by me, not by the AI.

## Definition of Done

- [ ] `npm run check` passes locally (lint, format:check, typecheck, test:ci).
- [ ] Tests cover the new behaviour; their names trace to acceptance criteria.
- [ ] No new `any`; no `eslint-disable` added to bypass the architecture guardrail.
- [ ] Screens and components still go through repositories — no direct `fetch` or storage.
- [ ] AGENTS.md / folder READMEs updated if a convention or structure changed.
- [ ] AI log entry written if AI was used, and its ID is above.
- [ ] CI is green.

## Reviewer

**The reviewer must not be the person who generated this code.** If AI wrote it, the reviewer
must be a teammate other than the author.

- [ ] Reviewer is not the author.
