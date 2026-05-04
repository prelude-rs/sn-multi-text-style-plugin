// Lasso entry point. Lifecycle:
//   1. Acquire the reentrancy guard (re-presses while running are no-ops).
//   2. Read the lasso elements via getLassoElements().
//   3. setLassoBoxState(1) to HIDE the lasso menu while our popup is up
//      (keeps the selection alive).
//   4. Show the popup; the user picks attributes to override.
//   5. On Apply: for each text element, narrow the lasso to that single
//      box via lassoElements(rect), then call modifyLassoText(newBox).
//      Each iteration is one undo step on the firmware's stack.
//   6. On any teardown (Apply / Cancel / no-text / error), set state=2
//      (Released) — we explicitly want NO selection at the end of the
//      operation. The user re-lassoes when they want another edit.
//
// Why the per-box loop instead of file-scoped modifyElements:
//   - PluginFileAPI.modifyElements is a direct file write — it does NOT
//     route through the firmware's edit pipeline, so it never reaches the
//     undo stack. The firmware's hardware undo button can't roll it back.
//   - PluginNoteAPI.modifyLassoText goes through the normal edit path
//     and IS undoable, but it requires "exactly one lassoed text box".
//   - PluginCommAPI.lassoElements(rect) lets us programmatically narrow
//     the lasso to a single rect. Combining the two: re-lasso → modify,
//     once per box. Each box becomes one undo step, which integrates
//     with the system's undo button.
//   - Side benefit: the firmware-native edit path handles the layout
//     recomputation + repaint that file-scoped writes left stale.
//   - Cost: N round-trips per Apply (vs 1 batched call). Acceptable for
//     reasonable selection sizes — undo support is the higher-value win.
//
// Sync-first release: the firmware's state:stop transition can suspend
// JS mid-await. release() runs synchronously before any await in the
// finally block, otherwise the busy flag can stay stuck `true`.

import {tryAcquire, release} from '../core/reentrancyGuard';
import {
  KEEP,
  applyStyleToBox,
  styleFromSelection,
  type Align,
  type Bold,
  type Italic,
  type TextStyle,
} from '../core/textStyle';
import type {APIResponse, LassoElement, Logger, Rect, TextBox} from '../sdk/types';
import {unwrap} from '../sdk/unwrap';
import {safeClosePluginView} from '../sdk/closeView';
import {hidePopup, showPopup, updatePopup} from '../ui/popupController';
import type {TextStylePopupCallbacks} from '../ui/TextStylePopup';

const LASSO_BOX_STATE_HIDDEN = 1;
const LASSO_BOX_STATE_RELEASED = 2;

export type LassoCommAPILike = {
  setLassoBoxState: (state: number) => Promise<APIResponse<boolean>>;
  closePluginView: () => Promise<boolean>;
  getLassoElements: () => Promise<APIResponse<LassoElement[]>>;
  lassoElements: (rect: Rect) => Promise<APIResponse<boolean>>;
};

export type NoteAPILike = {
  modifyLassoText: (textBox: object) => Promise<APIResponse<boolean>>;
};

export type LassoDeps = {
  comm: LassoCommAPILike;
  noteApi: NoteAPILike;
  logger: Logger;
};

export type LassoOutcome = 'opened' | 'busy' | 'failed' | 'no-text-boxes';

const TAG = 'mtstyle:lasso';

const safeSetLassoBoxState = async (deps: LassoDeps, state: number): Promise<void> => {
  try {
    const res = await deps.comm.setLassoBoxState(state);
    if (!res || !res.success) {
      deps.logger.warn(`[${TAG}] setLassoBoxState(${state}) success=false: ${res?.error?.message ?? 'unknown'}`);
    }
  } catch (e) {
    deps.logger.warn(`[${TAG}] setLassoBoxState(${state}) threw: ${(e as Error).message}`);
  }
};

const tryGetLassoElements = async (deps: LassoDeps): Promise<LassoElement[] | null> => {
  try {
    const result = unwrap(await deps.comm.getLassoElements(), 'getLassoElements');
    return Array.isArray(result) ? result : [];
  } catch (e) {
    deps.logger.warn(`[${TAG}] getLassoElements failed: ${(e as Error).message}`);
    return null;
  }
};

// Single teardown: release the lasso (state=2) — no selection should
// persist past the operation. Used for every exit path.
const teardown = async (deps: LassoDeps): Promise<void> => {
  release();
  hidePopup();
  await safeSetLassoBoxState(deps, LASSO_BOX_STATE_RELEASED);
  await safeClosePluginView(deps.comm, deps.logger);
};

// Apply a style to every box by looping per-box through the
// firmware-native lasso edit path:
//   1. lassoElements(box.textRect) — narrow to one box.
//   2. modifyLassoText(applyStyleToBox(box, style)) — single-box edit
//      that hits the undo stack.
const applyToAll = async (
  deps: LassoDeps,
  boxes: ReadonlyArray<TextBox>,
  style: TextStyle,
): Promise<{ok: number; failed: number}> => {
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i]!;
    try {
      const lassoRes = await deps.comm.lassoElements(box.textRect);
      if (!lassoRes || !lassoRes.success) {
        deps.logger.warn(`[${TAG}] lassoElements(box ${i}) failed: ${lassoRes?.error?.message ?? 'unknown'}`);
        failed++;
        continue;
      }
      const newBox = applyStyleToBox(box, style);
      const modRes = await deps.noteApi.modifyLassoText(newBox);
      if (!modRes || !modRes.success) {
        deps.logger.warn(`[${TAG}] modifyLassoText(box ${i}) failed: ${modRes?.error?.message ?? 'unknown'}`);
        failed++;
        continue;
      }
      ok++;
    } catch (e) {
      deps.logger.warn(`[${TAG}] apply box ${i} threw: ${(e as Error).message}`);
      failed++;
    }
  }
  return {ok, failed};
};

export const onLassoMain = async (deps: LassoDeps): Promise<LassoOutcome> => {
  if (!tryAcquire()) {
    deps.logger.warn(`[${TAG}] pipeline already running — ignoring re-entry`);
    await safeClosePluginView(deps.comm, deps.logger);
    return 'busy';
  }

  const lassoElements = await tryGetLassoElements(deps);
  if (lassoElements === null) {
    deps.logger.error(`[${TAG}] could not read lasso elements — aborting`);
    await teardown(deps);
    return 'failed';
  }

  // Filter to text-box elements only. The button is registered with
  // editDataTypes=[3] (text-box only), so non-text elements shouldn't
  // appear here, but defensive in case the firmware widens the lasso.
  const textElements = lassoElements.filter(e => e.textBox != null);

  if (textElements.length === 0) {
    deps.logger.warn(`[${TAG}] no text boxes in lasso — closing`);
    await teardown(deps);
    return 'no-text-boxes';
  }

  const boxes: TextBox[] = textElements.map(e => e.textBox as TextBox);

  // Hide the lasso menu while the popup is up. State=1 keeps the
  // selection alive while removing the visual pollution of the menu
  // under our overlay.
  await safeSetLassoBoxState(deps, LASSO_BOX_STATE_HIDDEN);

  // Closure-local mutable draft. The popup mutates it via callbacks;
  // Apply reads it once.
  let draft: TextStyle = styleFromSelection(boxes);

  // Unique font paths present in the selection — surfaced in the font
  // picker so the user can see (and re-apply) fonts already in use.
  const selectionFonts: ReadonlyArray<string | null> = [...new Set(boxes.map(b => b.fontPath ?? null))];
  deps.logger.log(`[${TAG}] selection fonts (${selectionFonts.length}): ${JSON.stringify(selectionFonts)}`);

  const refresh = (): void => {
    updatePopup({style: draft});
  };

  const setField = <K extends keyof TextStyle>(key: K, value: TextStyle[K]): void => {
    draft = {...draft, [key]: value};
    refresh();
  };

  const callbacks: TextStylePopupCallbacks = {
    onSetFont: (path: string | null) => setField('fontPath', path),
    onResetFont: () => setField('fontPath', KEEP),
    onSetSize: (size: number) => setField('fontSize', size),
    onResetSize: () => setField('fontSize', KEEP),
    onSetBold: (bold: Bold) => setField('bold', bold),
    onResetBold: () => setField('bold', KEEP),
    onSetItalic: (italic: Italic) => setField('italic', italic),
    onResetItalic: () => setField('italic', KEEP),
    onSetAlign: (align: Align) => setField('align', align),
    onResetAlign: () => setField('align', KEEP),
    onApply: () => {
      (async () => {
        try {
          const result = await applyToAll(deps, boxes, draft);
          deps.logger.log(`[${TAG}] applied style ok=${result.ok} failed=${result.failed} (n=${boxes.length})`);
        } catch (e) {
          deps.logger.error(`[${TAG}] apply crashed: ${(e as Error).message}`);
        } finally {
          await teardown(deps);
        }
      })().catch(() => {
        /* logged inside */
      });
    },
    onCancel: () => {
      teardown(deps).catch(() => {
        /* logged inside */
      });
    },
  };

  showPopup(
    {
      style: draft,
      selectionCount: boxes.length,
      selectionFonts,
    },
    callbacks,
  );

  deps.logger.log(`[${TAG}] popup opened (n=${boxes.length})`);

  return 'opened';
};
