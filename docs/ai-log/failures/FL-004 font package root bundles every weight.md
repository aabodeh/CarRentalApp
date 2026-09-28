---
id: FL-004
date: 2026-09-28
author: Moha
related_interaction: A-008
what_went_wrong: Imported three Schibsted Grotesk weights from the `@expo-google-fonts/schibsted-grotesk` package root, which `require()`s all twelve `.ttf` files, so the bundle shipped ~1.2 MB of fonts to use ~300 KB
how_caught: manual testing
fix: Import each weight from its subpath (`@expo-google-fonts/schibsted-grotesk/400Regular` etc.); re-export confirmed only three `.ttf` files are bundled
---

# FL-004 — font package root bundles every weight

## What went wrong

During [[A-008 domain types design system and dummy data]], Claude Code wrote `src/theme/typography.ts`
to load the three weights the type scale uses:

```ts
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_700Bold,
} from '@expo-google-fonts/schibsted-grotesk';
```

It looks like a normal named import, but it isn't tree-shaken. The package's root `index.js` is a
flat list of `require('./<weight>/<file>.ttf')` calls. Metro treats every `require` of an asset as
a file to bundle, whichever export is actually used. So the app bundled all twelve weights: regular
through black, each with an italic, about 100 KB apiece and about 1.2 MB in total. Only three of
those weights are used, about 300 KB.

The package README shows this root-import form, and the AI copied it without checking what it pulls
in.

## How it was caught

The AI caught this itself, and only because the plan included a boot check. Running
`npx expo export --platform android` to confirm the worklets babel plugin was active printed the
bundled asset list, and that list included `800ExtraBold_Italic`, `900Black` and the other unused
weights.

Would it have been caught otherwise? **No.** `npm run check` was green throughout: lint, prettier,
typecheck and all tests passed. Jest mocks asset `require`s, so the tests never see a `.ttf` file.
`expo-doctor` doesn't look at bundle contents, and the app runs perfectly well with twelve fonts
loaded. The only symptom is a larger download and a slightly slower first launch, and nobody would
have noticed either during this project.

## Fix

Each weight is imported from its own subpath, which `require`s exactly one file:

```ts
import { SchibstedGrotesk_400Regular } from '@expo-google-fonts/schibsted-grotesk/400Regular';
import { SchibstedGrotesk_500Medium } from '@expo-google-fonts/schibsted-grotesk/500Medium';
import { SchibstedGrotesk_700Bold } from '@expo-google-fonts/schibsted-grotesk/700Bold';
```

Re-running `npx expo export` showed exactly three `.ttf` files of 101 KB each. `App.tsx` now takes
`useFonts` from `expo-font` directly instead of through the font package's root re-export, so
nothing imports the root any more. The fix is in the same PR, commit `dad51b1`
(`feat(theme): …`).

## Prevention

- **AGENTS.md > Lessons learned:** added the entry "Import Google Fonts per weight, not from the
  package root". It also says that after adding any package that brings assets, you run
  `npx expo export` once and read the asset list.
- A lint rule is possible: `no-restricted-imports` with the pattern `@expo-google-fonts/*` but not
  its subpaths. It isn't added yet, because we load exactly one font family, in one file, and a
  rule for a single import site costs more to explain than it saves. Revisit this if a second
  family is added.
