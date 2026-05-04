// Bridge between the lasso button handler and the popup component.
// State carries the popup's editable style draft + selection metadata.
//
// `subscribe()` replays current state immediately so a `show()` that
// fired before React's first mount cycle isn't lost (the popup mount
// race documented in the sn-plugin skill).

import {DEFAULT_STYLE, type TextStyle} from '../core/textStyle';
import type {TextStylePopupCallbacks} from './TextStylePopup';

export type PopupState = {
  active: boolean;
  style: TextStyle;
  selectionCount: number;
  selectionFonts: ReadonlyArray<string | null>;
  callbacks: TextStylePopupCallbacks | null;
};

type Listener = (state: PopupState) => void;

const initialState: PopupState = {
  active: false,
  style: DEFAULT_STYLE,
  selectionCount: 0,
  selectionFonts: [],
  callbacks: null,
};

let currentState: PopupState = initialState;
const listeners = new Set<Listener>();

const emit = (next: PopupState): void => {
  currentState = next;
  listeners.forEach(l => l(next));
};

export const showPopup = (args: Omit<PopupState, 'active' | 'callbacks'>, callbacks: TextStylePopupCallbacks): void => {
  emit({active: true, ...args, callbacks});
};

export const updatePopup = (patch: Partial<Omit<PopupState, 'active' | 'callbacks'>>): void => {
  if (!currentState.active) {
    return;
  }
  emit({...currentState, ...patch});
};

export const hidePopup = (): void => {
  emit(initialState);
};

export const getCurrentState = (): PopupState => currentState;

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
};

export const __testing__ = {
  reset: () => {
    listeners.clear();
    currentState = initialState;
  },
};
