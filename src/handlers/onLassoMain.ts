// Lasso entry point. Lifecycle:
//   1. Acquire the reentrancy guard (re-presses while running are no-ops).
//   2. Read the lasso text boxes via getLassoText().
//   3. setLassoBoxState(1) to HIDE the lasso menu while our popup is up
//      (keeps the selection alive — required by modifyLassoText).
//   4. Show the popup; the user picks attributes to override.
//   5. On Apply: iterate the captured boxes, send modifyLassoText for
//      each with the merged style. Then setLassoBoxState(0) to RESHOW
//      the lasso menu so the selection stays visible — the user can
//      reopen the popup and apply another change without re-lassoing.
//   6. On Cancel: same teardown minus the modifications.
//
// Why state=0 (Show) on teardown rather than state=2 (Released):
//   - The user explicitly wants the lasso selection to persist after
//     applying a style — they often want to iterate.
//   - We don't call resizeLassoRect, so we don't need state=2 to
//     commit any pending visual transform.
//   - state=0 leaves the selection visible + the lasso menu live.
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
import type {APIResponse, Logger, Rect, TextBox} from '../sdk/types';
import {unwrap} from '../sdk/unwrap';
import {safeClosePluginView} from '../sdk/closeView';
import {hidePopup, showPopup, updatePopup} from '../ui/popupController';
import type {TextStylePopupCallbacks} from '../ui/TextStylePopup';

const LASSO_BOX_STATE_SHOW = 0;
const LASSO_BOX_STATE_HIDDEN = 1;
const LASSO_BOX_STATE_RELEASED = 2;

export type LassoCommAPILike = {
  getLassoRect: () => Promise<APIResponse<Rect>>;
  setLassoBoxState: (state: number) => Promise<APIResponse<boolean>>;
  closePluginView: () => Promise<boolean>;
};

export type NoteAPILike = {
  getLassoText: () => Promise<APIResponse<TextBox[]>>;
  modifyLassoText: (textBox: TextBox) => Promise<APIResponse<boolean>>;
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

const tryGetLassoText = async (deps: LassoDeps): Promise<TextBox[] | null> => {
  try {
    const result = unwrap(await deps.noteApi.getLassoText(), 'getLassoText');
    return Array.isArray(result) ? result : [];
  } catch (e) {
    deps.logger.warn(`[${TAG}] getLassoText failed: ${(e as Error).message}`);
    return null;
  }
};

// Teardown for Apply: keep the lasso visible (state=0) so the user
// can iterate without re-lassoing. closePluginView removes our
// overlay; the lasso menu re-renders on its own.
const teardownKeepLasso = async (deps: LassoDeps): Promise<void> => {
  release();
  hidePopup();
  await safeSetLassoBoxState(deps, LASSO_BOX_STATE_SHOW);
  await safeClosePluginView(deps.comm, deps.logger);
};

// Teardown for the no-selection / fatal error path. Releases the
// lasso completely so the gesture chain is clean.
const teardownReleaseLasso = async (deps: LassoDeps): Promise<void> => {
  release();
  hidePopup();
  await safeSetLassoBoxState(deps, LASSO_BOX_STATE_RELEASED);
  await safeClosePluginView(deps.comm, deps.logger);
};

const applyToAll = async (
  deps: LassoDeps,
  boxes: ReadonlyArray<TextBox>,
  style: TextStyle,
): Promise<{ok: number; failed: number}> => {
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i]!;
    const next = applyStyleToBox(box, style);
    try {
      const res = await deps.noteApi.modifyLassoText(next);
      if (res && res.success) {
        ok += 1;
      } else {
        failed += 1;
        deps.logger.warn(`[${TAG}] modifyLassoText[${i}] success=false: ${res?.error?.message ?? 'unknown'}`);
      }
    } catch (e) {
      failed += 1;
      deps.logger.warn(`[${TAG}] modifyLassoText[${i}] threw: ${(e as Error).message}`);
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

  const boxes = await tryGetLassoText(deps);
  if (boxes === null) {
    deps.logger.error(`[${TAG}] could not read lasso text boxes — aborting`);
    await teardownReleaseLasso(deps);
    return 'failed';
  }

  if (boxes.length === 0) {
    // The button is registered with editDataTypes=[3] (text-box only),
    // so reaching this branch means the firmware accepted the press
    // but the selection turned up empty — most likely the user
    // cleared the selection between press and our read.
    deps.logger.warn(`[${TAG}] no text boxes in lasso — closing`);
    await teardownReleaseLasso(deps);
    return 'no-text-boxes';
  }

  // Hide the lasso menu while the popup is up. State=1 keeps the
  // selection alive (so modifyLassoText still has something to act
  // on) while removing the visual pollution of the menu under our
  // overlay.
  await safeSetLassoBoxState(deps, LASSO_BOX_STATE_HIDDEN);

  // Closure-local mutable draft. The popup mutates it via callbacks;
  // Apply reads it once.
  let draft: TextStyle = styleFromSelection(boxes);

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
          await teardownKeepLasso(deps);
        }
      })().catch(() => {
        /* logged inside */
      });
    },
    onCancel: () => {
      teardownKeepLasso(deps).catch(() => {
        /* logged inside */
      });
    },
  };

  showPopup(
    {
      style: draft,
      selectionCount: boxes.length,
    },
    callbacks,
  );

  deps.logger.log(`[${TAG}] popup opened (n=${boxes.length})`);

  return 'opened';
};
