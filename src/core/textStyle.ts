// Text-style domain. Pure logic — no firmware dependencies, fully
// unit-testable.
//
// A "style" is the set of attributes the popup lets the user override.
// Each attribute is either a concrete value (apply to all selected
// boxes) or `null` (don't change — keep each box's current value).
// "Null" makes the popup honest about mixed selections: if the user
// lassoes boxes with different fonts and never touches the Font
// control, no box's font gets rewritten.
//
// We model that as a sentinel value `KEEP` rather than literal null
// so the type system can keep TextStyle's fields non-nullable inside
// the merge function.

import type {TextBox} from '../sdk/types';

export const KEEP = Symbol('KEEP');
export type Keep = typeof KEEP;

export type StyleValue<T> = T | Keep;

export type Align = 0 | 1 | 2; // 0=left, 1=center, 2=right
export type Bold = 0 | 1;
export type Italic = 0 | 1;

export type TextStyle = {
  fontPath: StyleValue<string | null>;
  fontSize: StyleValue<number>;
  bold: StyleValue<Bold>;
  italic: StyleValue<Italic>;
  align: StyleValue<Align>;
};

export const FONT_KEEP_LABEL = '__keep__';

// Curated set of known Supernote system fonts. fontPath = null is the
// firmware default; the rest are paths that ship on A5X2 firmware.
// Plugins can't enumerate /system/fonts at runtime (no fs read perm
// exposed by the host), so we ship a closed list. Users wanting a
// font outside this list keep their per-box font by leaving Font on
// "Keep current".
export type FontOption = {
  id: string;
  label: string;
  path: string | null;
};

export const FONT_OPTIONS: ReadonlyArray<FontOption> = [
  {id: 'default', label: 'Default', path: null},
  {id: 'serif', label: 'Serif', path: '/system/fonts/NotoSerif-Regular.ttf'},
  {id: 'sans', label: 'Sans', path: '/system/fonts/Roboto-Regular.ttf'},
  {id: 'mono', label: 'Mono', path: '/system/fonts/DroidSansMono.ttf'},
];

export const SIZE_MIN = 8;
export const SIZE_MAX = 200;
export const SIZE_STEP = 2;

export const clampSize = (size: number): number => {
  if (Number.isNaN(size)) {
    return SIZE_MIN;
  }
  return Math.max(SIZE_MIN, Math.min(SIZE_MAX, Math.round(size)));
};

export const DEFAULT_STYLE: TextStyle = {
  fontPath: KEEP,
  fontSize: KEEP,
  bold: KEEP,
  italic: KEEP,
  align: KEEP,
};

// Initial popup state derived from the lasso selection. If every box
// agrees on a value, expose it as the default; otherwise leave KEEP so
// the user has to opt-in to overwriting.
export const styleFromSelection = (boxes: ReadonlyArray<TextBox>): TextStyle => {
  if (boxes.length === 0) {
    return {...DEFAULT_STYLE};
  }
  const first = boxes[0]!;
  const allAgree = <K extends keyof TextBox>(key: K): boolean => boxes.every(b => b[key] === first[key]);

  return {
    fontPath: allAgree('fontPath') ? (first.fontPath ?? null) : KEEP,
    fontSize: allAgree('fontSize') ? clampSize(first.fontSize) : KEEP,
    bold: allAgree('textBold') ? (first.textBold === 1 ? 1 : 0) : KEEP,
    italic: allAgree('textItalics') ? (first.textItalics === 1 ? 1 : 0) : KEEP,
    align: allAgree('textAlign') ? clampAlign(first.textAlign) : KEEP,
  };
};

const clampAlign = (n: number): Align => (n === 1 ? 1 : n === 2 ? 2 : 0);

// Merge a TextStyle into a TextBox. Returns a new TextBox with the
// non-KEEP fields overwritten. The original box is untouched, so
// callers can compare before/after for logging.
export const applyStyleToBox = (box: TextBox, style: TextStyle): TextBox => {
  const next: TextBox = {...box};
  if (style.fontPath !== KEEP) {
    next.fontPath = style.fontPath;
  }
  if (style.fontSize !== KEEP) {
    next.fontSize = clampSize(style.fontSize);
  }
  if (style.bold !== KEEP) {
    next.textBold = style.bold;
  }
  if (style.italic !== KEEP) {
    next.textItalics = style.italic;
  }
  if (style.align !== KEEP) {
    next.textAlign = style.align;
  }
  return next;
};

export const isStyleNoop = (style: TextStyle): boolean =>
  style.fontPath === KEEP &&
  style.fontSize === KEEP &&
  style.bold === KEEP &&
  style.italic === KEEP &&
  style.align === KEEP;
