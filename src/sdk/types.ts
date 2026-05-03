// Narrow shapes for the SDK slices we use. Keeping them structural
// avoids importing sn-plugin-lib classes at module-load time and lets
// the test suite supply lightweight fakes.

export type APIResponse<T> = {
  success: boolean;
  result?: T;
  error?: {code: number; message: string};
};

export type Logger = {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
};

export type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

// Subset of the firmware TextBox shape that the modifyLassoText API
// validates as required + the four style fields we mutate. Other
// fields (textDigestData, textFrameStyle, etc.) pass through unchanged
// when we round-trip them from getLassoText().
export type TextBox = {
  fontSize: number;
  fontPath: string | null;
  textContentFull: string | null;
  textRect: Rect;
  textAlign: number;
  textBold: number;
  textItalics: number;
  textFrameWidthType: number;
  textFrameStyle: number;
  textEditable: number;
  textDigestData?: string | null;
};
