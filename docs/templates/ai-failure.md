---
id: FL-000
date: YYYY-MM-DD
author:
related_interaction: # A-### this came out of, if any
what_went_wrong:
how_caught: # test | CI | code review | manual testing | typecheck | lint
fix:
---

# FL-000 — <short title>

## What went wrong

<What the AI produced and why it was wrong or off-spec. Quote the bad output if it
is short. Be concrete — "it hallucinated an API" is less useful than "it called
`Expo.FileSystem.readAsStringAsync`, which does not exist in SDK 57".>

## How it was caught

<Which check caught it, and — more interestingly — whether it would have been caught
if that check did not exist.>

## Fix

<What we did instead, and why that is correct. Link the commit or PR.>

## Prevention

<Should this become a rule in AGENTS.md > Lessons learned, a lint rule, or a test?
If yes, say which, and do it.>
