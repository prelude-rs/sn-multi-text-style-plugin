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

// Subset of the firmware TextBox shape. Fields pass through unchanged
// when round-tripped from getLassoText() into modifyElements().
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
  textFrameWidth?: number;
};

// Element returned by PluginCommAPI.getLassoElements(). The SDK applies
// transformElements() so each element already carries uuid + native
// angles/contoursSrc accessors that the host validator requires when
// round-tripping through modifyElements. We narrow only the fields we
// read; the rest is opaque but MUST be preserved, hence the index
// signature.
export type LassoElement = {
  uuid: string;
  type: number;
  textBox?: TextBox | null;
  [key: string]: unknown;
};
