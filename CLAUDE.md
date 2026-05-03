# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this plugin does

Lasso a group of text boxes inside a Supernote note → press the **Text Style** button in the lasso toolbar → pick `font / size / bold / italic / align` → apply to every box in one shot. The lasso selection is preserved after Apply so the user can iterate.

## Commands

```sh
npm install               # install RN + sn-plugin-lib + jest deps
npm test                  # jest (no flags needed; mock-based, no native deps)
npm run lint              # eslint
npm run coverage          # jest --coverage
npx tsc --noEmit          # type check
npm run build             # → build/outputs/SnMultiTextStyle.snplg (sideload via plugin manager)
```

Single test: `npx jest __tests__/textStyle.test.ts -t "applyStyleToBox"`

## Architecture (the parts that span multiple files)

Pipeline for one button press:

```
firmware lasso button id=301
        │
        ▼
  index.js (event router)
        │  forwards by event.id
        ▼
  src/handlers/onLassoMain.ts
        │  acquires reentrancyGuard, reads lasso boxes, hides menu
        ▼
  src/ui/popupController.ts (state bus + replay-on-subscribe)
        │  showPopup({style, selectionCount}, callbacks)
        ▼
  src/ui/PopupRoot → TextStylePopup  (React tree mounted by App.tsx)
        │  callbacks back into onLassoMain's closure
        ▼
  apply: iterate boxes → modifyLassoText(box) for each
  teardown: setLassoBoxState(0) — RESHOW the lasso (do NOT release with state=2)
```

Key design choices, none of which are obvious from the code alone:

1. **`editDataTypes: [3]`** on the lasso button restricts visibility to text-box-only selections. Mixed selections (text + strokes / shapes / images) hide the button entirely — this is the firmware's filter, not ours. The `0` no-text-boxes branch in `onLassoMain` handles a narrow race where the user clears the selection between press and our read.

2. **`KEEP` sentinel** in `src/core/textStyle.ts` is the difference between "set this attribute on every box" and "leave each box alone for this attribute". The popup defaults each control to `KEEP` for fields where the lassoed boxes disagree (mixed selection → don't auto-overwrite). When all boxes agree, we expose the unified value as the default. Apply only writes fields that are non-KEEP.

3. **`modifyLassoText` operates one box at a time**. The firmware identifies the target by `textRect`. So Apply iterates the captured selection and round-trips each box through `applyStyleToBox` (preserves `textRect` + `textContentFull`, mutates only the chosen style fields).

4. **Lasso lifecycle** differs from sn-align-plugin:
   - On entry: `setLassoBoxState(1)` (hide menu, keep selection alive).
   - On Apply / Cancel: `setLassoBoxState(0)` (re-show menu, **keep** the selection visible). User can re-press the button without re-lassoing — explicit product spec.
   - State `2` (Released) is only used on the no-text-boxes / fatal error path — see `teardownReleaseLasso` vs `teardownKeepLasso`.

5. **Sync-first `release()`** in the reentrancy guard. The firmware's `state:stop` transition can suspend JS mid-`await`. If `release()` ran after `await closePluginView()`, the busy flag would be stuck `true` and every subsequent button press would be rejected. The guard is cleared synchronously inside both teardown helpers before the first `await`.

6. **Popup state bus replays on subscribe** (`subscribe(l)` calls `l(currentState)` immediately). The firmware can mount the React tree after our handler's `showPopup()` has already fired — without replay the first state is dropped and PopupRoot renders its empty fallback.

7. **PopupRoot never returns `null`**. An empty fallback (header + close button) is rendered instead. Returning `null` causes the firmware to dismiss the overlay before our state update lands (sn-dictionary's `DefinitionPopup` precedent).

## Logging

The firmware suppresses `console.warn` / `console.error` from logcat — every `ReactNativeJS` line is at info level. Always go through `console.log` with explicit level prefixes (see `index.js` logger). Tagged with `[mtstyle:*]`. Grep on device:

```sh
adb logcat | grep -E 'ReactNativeJS.*\[mtstyle:'
```

## Identifiers that must NOT change after first install

- `pluginID: snplgmtstylev1` (firmware caches by it; renaming forces every user to reinstall)
- `pluginKey: SnMultiTextStyle` (must equal `app.json` `name`; mismatch raises `Invariant Violation: "X" has not been registered`)
- `LASSO_TEXT_STYLE_BUTTON_ID = 301` in `src/buttons/registerLassoButton.ts` is the listener key

## Testing strategy

All tests run on Node + jest with no native modules — every firmware boundary is faked:
- `__tests__/textStyle.test.ts` — pure logic for `KEEP`, `clampSize`, `styleFromSelection`, `applyStyleToBox`.
- `__tests__/onLassoMain.test.ts` — full handler with stub `comm` + `noteApi`. Covers entry, mixed-selection seeding, apply iteration, partial failures, sync-first release, and `setLassoBoxState(0)` on Apply.
- `__tests__/popupController.test.ts` — state bus, including subscribe-replay race.
- `__tests__/reentrancyGuard.test.ts`, `__tests__/i18n.test.ts` — small surface checks.

The handler test deliberately verifies `setLassoBoxState` was called with `0` and **not** `2` on Apply, since "keep lasso visible after re-style" is a product requirement.

## Sibling references

When a Supernote firmware quirk shows up that isn't covered here, grep these:

- `~/repo/SN/sn-align-plugin` — closest cousin (popup-driven lasso flow, same chrome).
- `~/repo/SN/sn-shapes` — canonical lasso flow + favorites storage pattern.
- `~/repo/SN/sn-dictionary` — popup mount race, `DefinitionPopup` for the never-null fallback.
