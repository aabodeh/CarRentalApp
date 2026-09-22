---
id: A-001
date: 2026-09-22
author: Moha
tool: Claude (claude.ai chat, Claude Opus 5)
mode: chat
area: docs
task: Give Claude the course context (Drive materials), review the repo, draft the initial Claude Code setup prompt
prompt_or_link: 'TODO (Moha): shared chat link'
verification: TODO (Moha)
decision: TODO (Moha)
related_pr:
---

# A-001 — course context and initial setup prompt

## Prompt

Three messages from Moha to Claude chat, verbatim:

1. "Acabo de iniciar el curso de Mobile Software Development en mi erasmus en la SDU. Para ello primero quiero que entiendas todo el contexto de la asignatura hasta ahora antes de ponernos manos a la obra. Para ello he puesto todos los recursos en un drive, que quiero que guardes en tu memoria para poder consultarlo siempre que sea necesario.

https://drive.google.com/drive/folders/1VK4QAcYoWvZyZG3svyiOgdb4_x9sa8HH"

2. "ahora estamos empezando en todo, el design doc está creado pero no empezado el repo está creado, es este: https://github.com/aabodeh/CarRentalApp"

3. "A mi me ha tocado la parte técnica, primero quiero que me des un prompt inicial para claude code para que configure todo lo necesario, reglas, ai policy de la asignatura, iniciar un obsidian o algo para guardar los prompts ya que el profe nos lo pidirá, el CI... Quiero que en un único prompt hacer toda esta configuración incial para que todos la tengan."

## Output summary

- A summary of the course: grading, dates, the AI policy, and the kernel NFRs K1–K3.
- A review of the repo as it then stood: the default `AGENTS.md`, no tests and no CI, untyped route
  params, and no "My bookings" screen.
- A 10-day plan up to the 2026-10-02 deadline.
- The initial setup prompt, stored here as [[P1]], which became the input to
  [[A-003 project setup scaffolding]].

## Evaluation

TODO (Moha)

## Alternatives considered without AI

TODO (Moha)
