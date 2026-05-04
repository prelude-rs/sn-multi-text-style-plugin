import {
  KEEP,
  SIZE_MAX,
  SIZE_MIN,
  applyStyleToBox,
  clampSize,
  isStyleNoop,
  styleFromSelection,
  type TextStyle,
} from '../src/core/textStyle';
import type {TextBox} from '../src/sdk/types';

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

describe('clampSize', () => {
  it('rounds to integer', () => {
    expect(clampSize(16.4)).toBe(16);
    expect(clampSize(16.6)).toBe(17);
  });
  it('clamps to SIZE_MIN', () => {
    expect(clampSize(0)).toBe(SIZE_MIN);
    expect(clampSize(-50)).toBe(SIZE_MIN);
  });
  it('clamps to SIZE_MAX', () => {
    expect(clampSize(SIZE_MAX + 100)).toBe(SIZE_MAX);
  });
  it('handles non-finite by falling back to SIZE_MIN', () => {
    expect(clampSize(NaN)).toBe(SIZE_MIN);
    expect(clampSize(Infinity)).toBe(SIZE_MAX);
  });
});

describe('isStyleNoop', () => {
  it('true when every field is KEEP', () => {
    const style: TextStyle = {
      fontPath: KEEP,
      fontSize: KEEP,
      bold: KEEP,
      italic: KEEP,
      align: KEEP,
    };
    expect(isStyleNoop(style)).toBe(true);
  });
  it('false when any field is set', () => {
    expect(isStyleNoop({fontPath: KEEP, fontSize: KEEP, bold: 1, italic: KEEP, align: KEEP})).toBe(false);
  });
});

describe('styleFromSelection', () => {
  it('returns all-KEEP for empty selection', () => {
    expect(styleFromSelection([])).toEqual({
      fontPath: KEEP,
      fontSize: KEEP,
      bold: KEEP,
      italic: KEEP,
      align: KEEP,
    });
  });

  it('seeds from the first box regardless of agreement', () => {
    const boxes = [
      baseBox({fontSize: 18, textBold: 1, textAlign: 1}),
      baseBox({fontSize: 22, textBold: 0, textAlign: 0, textContentFull: 'x'}),
    ];
    const s = styleFromSelection(boxes);
    expect(s.fontSize).toBe(18);
    expect(s.bold).toBe(1);
    expect(s.align).toBe(1);
  });

  it('seeds font path from first box (null becomes null, not KEEP)', () => {
    const boxes = [baseBox({fontPath: null}), baseBox({fontPath: '/system/fonts/Roboto.ttf', textContentFull: 'x'})];
    expect(styleFromSelection(boxes).fontPath).toBe(null);
  });

  it('seeds concrete font path from first box', () => {
    const path = '/system/fonts/NotoSerif-Regular.ttf';
    const boxes = [baseBox({fontPath: path}), baseBox({fontPath: null, textContentFull: 'x'})];
    expect(styleFromSelection(boxes).fontPath).toBe(path);
  });
});

describe('applyStyleToBox', () => {
  it('passes through every field when style is all-KEEP', () => {
    const box = baseBox({fontSize: 22, textBold: 1, textAlign: 2, fontPath: '/system/fonts/Roboto.ttf'});
    const next = applyStyleToBox(box, {
      fontPath: KEEP,
      fontSize: KEEP,
      bold: KEEP,
      italic: KEEP,
      align: KEEP,
    });
    expect(next).toEqual(box);
    expect(next).not.toBe(box);
  });

  it('overwrites only the specified fields', () => {
    const box = baseBox({fontSize: 22, textBold: 0, textAlign: 0});
    const next = applyStyleToBox(box, {
      fontPath: KEEP,
      fontSize: 30,
      bold: 1,
      italic: KEEP,
      align: 2,
    });
    expect(next.fontSize).toBe(30);
    expect(next.textBold).toBe(1);
    expect(next.textAlign).toBe(2);
    expect(next.textItalics).toBe(box.textItalics);
    expect(next.fontPath).toBe(box.fontPath);
  });

  it('clamps fontSize on apply', () => {
    const box = baseBox();
    const huge = applyStyleToBox(box, {
      fontPath: KEEP,
      fontSize: 9999,
      bold: KEEP,
      italic: KEEP,
      align: KEEP,
    });
    expect(huge.fontSize).toBe(SIZE_MAX);
  });

  it('preserves textRect + textContentFull untouched (required by modifyLassoText)', () => {
    const box = baseBox({textRect: {left: 50, top: 60, right: 200, bottom: 90}, textContentFull: 'preserve me'});
    const next = applyStyleToBox(box, {
      fontPath: KEEP,
      fontSize: 24,
      bold: KEEP,
      italic: KEEP,
      align: KEEP,
    });
    expect(next.textRect).toEqual({left: 50, top: 60, right: 200, bottom: 90});
    expect(next.textContentFull).toBe('preserve me');
  });
});
