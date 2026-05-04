import {onLassoMain, type LassoDeps} from '../src/handlers/onLassoMain';
import {release} from '../src/core/reentrancyGuard';
import {__testing__ as popupTesting, getCurrentState} from '../src/ui/popupController';
import type {LassoElement, Rect, TextBox} from '../src/sdk/types';

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

const wrapElement = (box: TextBox, i: number): LassoElement => ({
  uuid: `uuid-${i}`,
  type: 500,
  textBox: {...box},
});

const buildDeps = (boxes: TextBox[] | null) => {
  const setLassoBoxState = jest.fn(async () => ok(true));
  const closePluginView = jest.fn(async () => true);
  const getLassoElements = jest.fn(async () =>
    boxes === null
      ? {success: false, error: {code: 1, message: 'no'}}
      : ok(boxes.map((b, i) => wrapElement(b, i))),
  );
  const lassoElements = jest.fn(async (_rect: Rect) => ok(true));
  const modifyLassoText = jest.fn(async (_textBox: object) => ok(true));
  const {logger, logs} = stubLogger();
  const deps: LassoDeps = {
    comm: {setLassoBoxState, closePluginView, getLassoElements, lassoElements},
    noteApi: {modifyLassoText},
    logger,
  };
  return {
    deps,
    getLassoElements,
    setLassoBoxState,
    closePluginView,
    lassoElements,
    modifyLassoText,
    logs,
  };
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

  it('seeds from first box when selection is mixed (not KEEP)', async () => {
    const {deps} = buildDeps([baseBox({fontSize: 24}), baseBox({fontSize: 18, textContentFull: 'b'})]);
    await onLassoMain(deps);
    expect(getCurrentState().style.fontSize).toBe(24);
  });

  it('returns "no-text-boxes" + closes when the selection is empty', async () => {
    const {deps, closePluginView, modifyLassoText, setLassoBoxState} = buildDeps([]);
    expect(await onLassoMain(deps)).toBe('no-text-boxes');
    expect(closePluginView).toHaveBeenCalled();
    // Released: state 2 commits / clears the lasso state.
    expect(setLassoBoxState).toHaveBeenCalledWith(2);
    expect(modifyLassoText).not.toHaveBeenCalled();
  });

  it('returns "failed" when getLassoElements throws', async () => {
    const {deps} = buildDeps(null);
    expect(await onLassoMain(deps)).toBe('failed');
  });

  it('rejects re-entry with "busy"', async () => {
    const {deps, closePluginView} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    expect(await onLassoMain(deps)).toBe('busy');
    expect(closePluginView).toHaveBeenCalled();
  });

  it('skips non-text elements when filtering the selection', async () => {
    const {deps, getLassoElements} = buildDeps([baseBox()]);
    (getLassoElements as jest.Mock).mockResolvedValueOnce(
      ok([
        {uuid: 'stroke-1', type: 0, textBox: null},
        wrapElement(baseBox(), 0),
        {uuid: 'geo-1', type: 700},
      ]),
    );
    expect(await onLassoMain(deps)).toBe('opened');
    expect(getCurrentState().selectionCount).toBe(1);
  });
});

describe('onLassoMain — apply', () => {
  it('loops per box: lassoElements(textRect) → modifyLassoText(newBox), each undoable', async () => {
    const boxes = [
      baseBox({fontSize: 12, textRect: {left: 0, top: 0, right: 100, bottom: 30}, textContentFull: 'a'}),
      baseBox({fontSize: 12, textRect: {left: 0, top: 50, right: 100, bottom: 80}, textContentFull: 'b'}),
    ];
    const {deps, lassoElements, modifyLassoText} = buildDeps(boxes);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(28);
    cbs.onSetBold(1);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // Once per box (no restore at the end — selection is released).
    expect(lassoElements).toHaveBeenCalledTimes(boxes.length);
    expect(lassoElements).toHaveBeenNthCalledWith(1, boxes[0]!.textRect);
    expect(lassoElements).toHaveBeenNthCalledWith(2, boxes[1]!.textRect);

    // One modifyLassoText per box, with the merged style applied.
    expect(modifyLassoText).toHaveBeenCalledTimes(boxes.length);
    const calls = modifyLassoText.mock.calls as unknown as Array<[TextBox]>;
    expect(calls[0]![0].fontSize).toBe(28);
    expect(calls[0]![0].textBold).toBe(1);
    expect(calls[0]![0].textRect).toEqual(boxes[0]!.textRect);
    expect(calls[0]![0].textContentFull).toBe('a');
    expect(calls[1]![0].fontSize).toBe(28);
    expect(calls[1]![0].textRect).toEqual(boxes[1]!.textRect);
    expect(calls[1]![0].textContentFull).toBe('b');
  });

  it('releases the lasso (state 2) after apply — no selection persists', async () => {
    const {deps, setLassoBoxState, closePluginView} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(20);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(setLassoBoxState).toHaveBeenCalledWith(2);
    expect(closePluginView).toHaveBeenCalled();
  });

  it('cancel never edits and releases the lasso (state 2)', async () => {
    const {deps, setLassoBoxState, modifyLassoText, lassoElements} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onCancel();
    await new Promise(r => setTimeout(r, 0));
    expect(modifyLassoText).not.toHaveBeenCalled();
    expect(lassoElements).not.toHaveBeenCalled();
    expect(setLassoBoxState).toHaveBeenCalledWith(2);
  });

  it('apply releases the reentrancy guard SYNCHRONOUSLY (sync-first)', async () => {
    // Simulate slow lasso ops: if release() ran AFTER the teardown awaits,
    // a second press during apply would be rejected even though apply
    // hasn't returned yet. release() must run in teardown's sync prologue.
    const {deps} = buildDeps([baseBox()]);
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(20);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    const second = await onLassoMain(deps);
    expect(second).toBe('opened');
  });
});

describe('onLassoMain — partial failures', () => {
  it('continues applying when one modifyLassoText fails', async () => {
    const boxes = [baseBox(), baseBox({textContentFull: 'b'})];
    const {deps, modifyLassoText, logs} = buildDeps(boxes);
    (modifyLassoText as jest.Mock).mockReset();
    (modifyLassoText as jest.Mock)
      .mockResolvedValueOnce({success: false, error: {code: 9, message: 'nope'}})
      .mockResolvedValueOnce(ok(true));
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(24);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(modifyLassoText).toHaveBeenCalledTimes(2);
    expect(logs.some(l => l.includes('ok=1 failed=1'))).toBe(true);
  });

  it('skips modifyLassoText when lassoElements fails for that box', async () => {
    const boxes = [baseBox(), baseBox({textContentFull: 'b'})];
    const {deps, lassoElements, modifyLassoText, logs} = buildDeps(boxes);
    (lassoElements as jest.Mock).mockReset();
    (lassoElements as jest.Mock)
      .mockResolvedValueOnce({success: false, error: {code: 9, message: 'narrow failed'}})
      .mockResolvedValueOnce(ok(true));
    await onLassoMain(deps);
    const cbs = getCurrentState().callbacks!;
    cbs.onSetSize(24);
    cbs.onApply();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    expect(modifyLassoText).toHaveBeenCalledTimes(1);
    expect(logs.some(l => l.includes('ok=1 failed=1'))).toBe(true);
  });
});
