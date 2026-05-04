# SnMultiTextStyle

> **Work in progress — not ready for use.**
> This plugin is currently blocked by missing functionality in the Supernote SDK: there is no way to increase a text box's font size without leaving the text clipped to its original bounding box. Development is on hold until the SDK exposes a way to trigger the firmware's box-to-text fit relayout from a plugin.

Restyle multiple Supernote text boxes at once. Lasso a group of text boxes, pick a font / size / bold / italic / alignment, and apply to all of them in one shot.

## How it works

1. Inside a note on the device, draw a lasso around the text boxes you want to restyle.
2. The lasso toolbar shows a **Text Style** button (only when the selection is text-boxes only — mixed selections hide it).
3. Press it. A popup opens with five controls:
   - **Font** — Default / Serif / Sans / Mono, plus a "Keep current" chip.
   - **Size** — stepper, 8–200, plus "Keep".
   - **Bold** — Off / On, plus "Keep".
   - **Italic** — Off / On, plus "Keep".
   - **Align** — Left / Center / Right, plus "Keep".
4. Hit **Apply**. The style is written to every text box in the selection. The lasso stays active so you can iterate (e.g. apply bold first, then bump size).
5. **Cancel** closes the popup with no changes; the lasso also stays active.

If the lassoed boxes already share a value (e.g. all bold), the popup pre-selects that value. If they disagree, "Keep" is selected — so a no-op Apply won't accidentally homogenise mixed selections.

## Build + install

```sh
npm install
npm run build              # → build/outputs/SnMultiTextStyle.snplg
```

Sideload `SnMultiTextStyle.snplg` via the Supernote plugin manager (USB or device file browser). The plugin registers a single lasso-toolbar button on Note files.

## Development

```sh
npm test                   # jest, no device needed
npm run lint
npx tsc --noEmit
```

Tested on Supernote A5X2 firmware (sn-plugin-lib ^0.1.19, RN 0.79.x).

## License

MIT — see `LICENSE`.
