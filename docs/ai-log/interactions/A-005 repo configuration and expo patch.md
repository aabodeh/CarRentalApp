---
id: A-005
date: 2026-09-22
author: Moha
tool: Claude Code (Claude Opus 5)
mode: agentic
area: code
task: Verify CI on main, repo settings + branch protection via gh, expo SDK patch PR
prompt_or_link: '[[P3]]'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr: https://github.com/aabodeh/CarRentalApp/pull/2
---

# A-005 — repo configuration and expo patch

## Prompt

[[P3]] — the repo configuration prompt, drafted in
[[A-004 setup review and repo config prompt]]. It asked Claude Code to show the exact commands before
changing any GitHub settings and to wait for approval.

## Output summary

### 1. CI on main — passed

```
completed  success  Merge pull request #1 from aabodeh/chore/project-setup  CI  main  push  43s
```

### 2. Branch protection — not done by the AI; blocked on permissions

```
$ gh api repos/aabodeh/CarRentalApp --jq .permissions
{"admin":false,"maintain":false,"pull":true,"push":true,"triage":true}
```

The account (`moha-ech`) has `push` but not `admin`, and every command in that step needs `admin`.
Per the prompt's instruction, the AI stopped and produced the exact `gh api` commands to hand to the
repository owner instead. **The owner ran them, not the AI.**

### 3. Expo patch — PR #2

Branch `chore/expo-sdk-patch`, two commits, merged as
[PR #2](https://github.com/aabodeh/CarRentalApp/pull/2):

- `chore: bump expo to ~57.0.24 to satisfy expo-doctor` — applied with `npx expo install --fix`.
  `expo-doctor` went from 20/21 to **21/21**.
- `chore: ignore Obsidian per-user state anywhere in the tree` — **not in the original scope.** Found
  while running `npm run check` to verify the first commit: a stray `docs/ai-log/.obsidian/`, created
  by opening a subfolder as an Obsidian vault, was failing `prettier --check .` locally while CI
  stayed green. Moha was asked whether to split it into its own PR or fold it in, and chose to fold
  it in.

`npm run check` exited 0. CI was green on the PR before merge.

### What was verified afterwards, and what could not be

After the owner applied the settings, the AI confirmed by reading the API:

- merge settings: `{"allow_merge_commit":false,"allow_rebase_merge":false,"allow_squash_merge":true,"delete_branch_on_merge":true}`
- `main` reports `protected: true`

It could **not** read the protection's contents — `gh api .../branches/main/protection` returns 404
for a non-admin, and GitHub returns 404 rather than 403 there. So the approval count, dismiss-stale,
`enforce_admins`, force-push/deletion blocks and the required status check string remain unverified
by this session. A `git push --dry-run` against `main` was attempted and reported success, but that
proves nothing: `--dry-run` never sends the pack, so the server-side hook that enforces protection
never runs. It was recorded as inconclusive rather than as evidence.

Two consequences of ordering, noted at the time: PRs #1 and #2 both landed as merge commits because
the squash-only setting was applied afterwards, and neither branch was auto-deleted for the same
reason. The branches were deleted manually at the start of [[A-007 ai log backfill]].

## Evaluation

TODO (Moha)

## Alternatives considered without AI

TODO (Moha)
