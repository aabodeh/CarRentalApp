# Car Rental App

A simple car rental mobile application built in React Native (Expo). Users can view a list of
available cars, view the details of each car, and place a booking.

The app starts with dummy data embedded in the repo, and later fetches from an API and persists
data locally — with offline reads, queued retries for failed writes, and a sync status the user
can always see.

Coursework for **Mobile Software Design & Development**, SDU, autumn 2026.

## Tech stack

- [Expo](https://expo.dev) SDK 57 + TypeScript (strict)
- [React Navigation](https://reactnavigation.org) (native-stack)
- React Context API for cross-screen state
- Jest + [`@testing-library/react-native`](https://callstack.github.io/react-native-testing-library/)
- ESLint (`eslint-config-expo`) + Prettier

Requires **Node ≥ 22.13** (Expo SDK 57).

## Getting started

```bash
npm install
npm start
```

Then either:

- press `w` to open the app in a web browser,
- press `a` / `i` for an Android emulator or iOS simulator,
- or scan the QR code with [Expo Go](https://expo.dev/go) on your phone (same Wi-Fi network).

## Before you push

```bash
npm run check
```

Runs lint, format check, typecheck and the test suite — the same four things CI runs.

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm start`            | Expo dev server                              |
| `npm run lint`         | ESLint, including the architecture guardrail |
| `npm run format`       | Prettier, writing changes                    |
| `npm run format:check` | Prettier, checking only                      |
| `npm run typecheck`    | `tsc --noEmit`                               |
| `npm test`             | Jest in watch mode                           |
| `npm run test:ci`      | Jest once, with coverage                     |
| `npm run check`        | all of the above checks, in order            |

## Project structure

```
App.tsx                 NavigationContainer + RootNavigator
__tests__/              all tests, mirroring the source tree
src/
  components/           reusable presentational pieces
  screens/              one file per screen
  navigation/           native-stack navigator + route param types
  context/              React Context providers
  hooks/                useX hooks connecting UI to repositories
  repositories/         the seam — the only layer that knows the data source
  services/api/         HTTP client
  storage/              local cache and retry queue
  data/dummy/           hard-coded sample data (temporary)
  types/                shared domain types
  theme/                colours, spacing, font sizes
  utils/                small pure helpers
docs/                   Obsidian vault: the AI log and note templates
```

Data flows **screens → hooks/context → repositories → data sources**. Screens never call `fetch`
and never touch storage; ESLint fails the build if they try. That boundary is what lets us swap
dummy data for the real API without editing a single screen.

Every folder has a README explaining what belongs in it.

## Documentation

| Where                                 | What                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [AGENTS.md](AGENTS.md)                | Architecture, conventions, testing rules and the Definition of Done. Read before writing code — applies to humans and AI assistants alike. |
| [CONTRIBUTING.md](CONTRIBUTING.md)    | Branch naming, Conventional Commits, the PR process, how to log AI use.                                                                    |
| [docs/ai-log/](docs/ai-log/README.md) | The AI dossier: every significant AI interaction and every AI failure, as Obsidian notes.                                                  |
| [CLAUDE.md](CLAUDE.md)                | AGENTS.md plus the Claude Code slash commands (`/log-ai`, `/log-failure`).                                                                 |

Open `docs/` as an [Obsidian](https://obsidian.md) vault (_Open folder as vault_) to browse the
AI log with working links. Nothing in it requires a community plugin.

## Status

Infrastructure and conventions only. Navigation skeleton with placeholder screens; no feature
logic, no dummy data and no domain types yet — those follow the class diagram in the design
document.
