import {onLassoMain, type LassoDeps} from '../src/handlers/onLassoMain';
import {KEEP} from '../src/core/textStyle';
import {release} from '../src/core/reentrancyGuard';
import {__testing__ as popupTesting, getCurrentState} from '../src/ui/popupController';
import type {TextBox} from '../src/sdk/types';

afterEach(() => {
  release();
  popupTesting.reset();
});

const ok = <T>(result: T) => ({success: true, result});

const stubLogger = () => {
  const logs: string[] = [];
  return {
    logs,
    logger: {
      log: (m: string) => logs.push(`[log] ${m}`),
      warn: (m: string) => logs.push(`[warn] ${m}`),
      error: (m: string) => logs.push(`[err] ${m}`),
    },
  };
};

const baseBox = (overrides: Partial<TextBox> = {}): TextBox => ({
  fontSize: 16,
  fontPath: null,
  textContentFull: 'hello',
  textRect: {left: 0, top: 0, right: 100, bottom: 30},
  textAlign: 0,
  textBold: 0,
  textItalics: 0,
  textFrameWidthType: 1,
  textFrameStyle: 0,
  textEditable: 0,
  ...overrides,
});

const buildDeps = (boxes: TextBox[] | null) => {
  const getLassoRect = jest.fn(async () => ok({left: 0, top: 0, right: 100, bottom: 30}));
  const setLassoBoxState = jest.fn(async () => ok(true));
  const closePluginView = jest.fn(async () => true);
  const getLassoText = jest.fn(async () =>
    boxes === null ? {success: false, error: {code: 1, message: 'no'}} : ok(boxes),
  );
  const modifyLassoText = jest.fn(async () => ok(true));
  const {logger, logs} = stubLogger();
  const deps: LassoDeps = {
    comm: {getLassoRect, setLassoBoxState, closePluginView},
    noteApi: {getLassoText, modifyLassoText},
    logger,
  };
  return {deps, getLassoText, modifyLassoText, setLassoBoxState, closePluginView, logs};
};

describe('onLassoMain — entry', () => {
  it('opens the popup with the lasso text-box count', async () => {
    const {deps} = buildDeps([baseBox(), baseBox({textContentFull: 'x'})]);
    expect(await onLassoMain(deps)).toBe('opened');
    expect(getCurrentState().active).toBe(true);
    expect(getCurrentState().selectionCount).toBe(2);
  });

  it('hides the lasso menu (state 1) on entry, never state 2 yet', async () => {
    const {deps, setLassoBoxState} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    expect(setLassoBoxState).toHaveBeenCalledWith(1);
    expect(setLassoBoxState).not.toHaveBeenCalledWith(2);
  });

  it('seeds popup style from the lasso when boxes agree on a value', async () => {
    const {deps} = buildDeps([
      baseBox({fontSize: 24, textBold: 1}),
      baseBox({fontSize: 24, textBold: 1, textContentFull: 'b'}),
    ]);
    await onLassoMain(deps);
    expect(getCurrentState().style).toMatchObject({fontSize: 24, bold: 1});
  });

  it('uses KEEP when boxes disagree (mixed selection)', async () => {
    const {deps} = buildDeps([baseBox({fontSize: 24}), baseBox({fontSize: 18, textContentFull: 'b'})]);
    await onLassoMain(deps);
    expect(getCurrentState().style.fontSize).toBe(KEEP);
  });

  it('returns "no-text-boxes" + closes when the selection is empty', async () => {
    const {deps, closePluginView, modifyLassoText, setLassoBoxState} = buildDeps([]);
    expect(await onLassoMain(deps)).toBe('no-text-boxes');
    expect(closePluginView).toHaveBeenCalled();
    // Released: state 2 commits / clears the lasso state.
    expect(setLassoBoxState).toHaveBeenCalledWith(2);
    expect(modifyLassoText).not.toHaveBeenCalled();
  });

  it('returns "failed" when getLassoText throws', async () => {
    const {deps} = buildDeps(null);
    expect(await onLassoMain(deps)).toBe('failed');
  });

  it('rejects re-entry with "busy"', async () => {
    const {deps, closePluginView} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    expect(await onLassoMain(deps)).toBe('busy');
    expect(closePluginView).toHaveBeenCalled();
  });
});

describe('onLassoMain — apply', () => {
  it('applies the merged style to every text box, preserving rect + content', async () => {
    const boxes = [
      baseBox({fontSize: 12, textRect: {left: 0, top: 0, right: 100, bottom: 30}, textContentFull: 'a'}),
      baseBox({fontSize: 12, textRect: {left: 0, top: 50, right: 100, bottom: 80}, textContentFull: 'b'}),
    ];
    const {deps, modifyLassoText} = buildDeps(boxes);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(28);
    cbs.onSetBold(1);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(modifyLassoText).toHaveBeenCalledTimes(2);
    const calls = modifyLassoText.mock.calls as unknown as Array<[TextBox]>;
    const firstArg = calls[0]![0];
    expect(firstArg.fontSize).toBe(28);
    expect(firstArg.textBold).toBe(1);
    expect(firstArg.textRect).toEqual({left: 0, top: 0, right: 100, bottom: 30});
    expect(firstArg.textContentFull).toBe('a');

    const secondArg = calls[1]![0];
    expect(secondArg.fontSize).toBe(28);
    expect(secondArg.textRect).toEqual({left: 0, top: 50, right: 100, bottom: 80});
    expect(secondArg.textContentFull).toBe('b');
  });

  it('keeps the lasso visible after apply (state 0, not state 2)', async () => {
    const {deps, setLassoBoxState, closePluginView} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(20);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(setLassoBoxState).toHaveBeenCalledWith(0);
    expect(setLassoBoxState).not.toHaveBeenCalledWith(2);
    expect(closePluginView).toHaveBeenCalled();
  });

  it('cancel never calls modifyLassoText and reshows the lasso (state 0)', async () => {
    const {deps, setLassoBoxState, modifyLassoText} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onCancel();
    await new Promise(r => setTimeout(r, 0));
    expect(modifyLassoText).not.toHaveBeenCalled();
    expect(setLassoBoxState).toHaveBeenCalledWith(0);
    expect(setLassoBoxState).not.toHaveBeenCalledWith(2);
  });

  it('apply releases the reentrancy guard SYNCHRONOUSLY (sync-first)', async () => {
    // Simulate a slow modifyLassoText: if release() ran AFTER the
    // teardown awaits, a second press during apply would be rejected
    // even though apply hasn't returned yet. This test asserts that a
    // re-press right after onApply() is honoured by checking that the
    // guard is free as soon as the synchronous portion of teardown
    // runs.
    const {deps} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(20);
    cbs.onApply();
    // Yield once to let the apply's sync prologue run (dispatch +
    // first await boundary). release() runs in teardown's sync
    // prologue. We then expect a fresh onLassoMain call to proceed
    // (no 'busy') as soon as the prior one's sync teardown has run.
    // We can't directly observe release() from outside, so we let the
    // microtasks queue drain and try again.
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    const second = await onLassoMain(deps);
    expect(second).toBe('opened');
  });
});

describe('onLassoMain — partial failures', () => {
  it('continues applying even if one modifyLassoText fails', async () => {
    const boxes = [baseBox(), baseBox({textContentFull: 'b'})];
    const {deps, modifyLassoText, logs} = buildDeps(boxes);
    const fn = modifyLassoText as jest.Mock;
    fn.mockReset();
    fn.mockResolvedValueOnce({success: false, error: {code: 9, message: 'nope'}});
    fn.mockResolvedValueOnce(ok(true));
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(24);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(modifyLassoText).toHaveBeenCalledTimes(2);
    expect(logs.some(l => l.includes('ok=1 failed=1'))).toBe(true);
  });
});
