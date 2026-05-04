import {__testing__, getCurrentState, hidePopup, showPopup, subscribe, updatePopup} from '../src/ui/popupController';
import {DEFAULT_STYLE, KEEP} from '../src/core/textStyle';
import type {TextStylePopupCallbacks} from '../src/ui/TextStylePopup';

afterEach(() => __testing__.reset());

const noop = () => {};
const stubCallbacks = (): TextStylePopupCallbacks => ({
  onSetFont: noop,
  onResetFont: noop,
  onSetSize: noop,
  onResetSize: noop,
  onSetBold: noop,
  onResetBold: noop,
  onSetItalic: noop,
  onResetItalic: noop,
  onSetAlign: noop,
  onResetAlign: noop,
  onApply: noop,
  onCancel: noop,
});

describe('popupController', () => {
  it('starts inactive with default style and zero selection', () => {
    expect(getCurrentState()).toEqual({
      active: false,
      style: DEFAULT_STYLE,
      selectionCount: 0,
      selectionFonts: [],
      callbacks: null,
    });
  });

  it('emits state on show with selection count + callbacks', () => {
    const cbs = stubCallbacks();
    showPopup({style: {...DEFAULT_STYLE, bold: 1}, selectionCount: 3, selectionFonts: []}, cbs);
    expect(getCurrentState()).toMatchObject({
      active: true,
      style: {bold: 1},
      selectionCount: 3,
      callbacks: cbs,
    });
  });

  it('subscribe replays current state immediately (race-safe)', () => {
    const cbs = stubCallbacks();
    showPopup({style: DEFAULT_STYLE, selectionCount: 2, selectionFonts: []}, cbs);

    let received: unknown = null;
    const unsub = subscribe(s => {
      received = s;
    });
    expect(received).toMatchObject({active: true, selectionCount: 2, callbacks: cbs});
    unsub();
  });

  it('updatePopup patches without changing callbacks or active', () => {
    const cbs = stubCallbacks();
    showPopup({style: DEFAULT_STYLE, selectionCount: 1, selectionFonts: []}, cbs);
    updatePopup({style: {...DEFAULT_STYLE, fontSize: 24}});
    expect(getCurrentState()).toMatchObject({
      active: true,
      style: {fontSize: 24, bold: KEEP},
      callbacks: cbs,
    });
  });

  it('updatePopup is a no-op when popup is inactive', () => {
    updatePopup({selectionCount: 9});
    expect(getCurrentState().active).toBe(false);
    expect(getCurrentState().selectionCount).toBe(0);
  });

  it('hide clears callbacks and resets to default state', () => {
    showPopup({style: DEFAULT_STYLE, selectionCount: 4, selectionFonts: []}, stubCallbacks());
    hidePopup();
    expect(getCurrentState()).toEqual({
      active: false,
      style: DEFAULT_STYLE,
      selectionCount: 0,
      selectionFonts: [],
      callbacks: null,
    });
  });
});
