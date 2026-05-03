// The host's overlay window keeps capturing pen touches at the OS
// InputDispatcher layer if we don't close it (sn-dictionary / sn-formula
// precedent). Always best-effort it; a thrown error here can't
// recover us, so just warn.

export type ClosablePluginView = {
  closePluginView: () => Promise<boolean>;
};

export type WarnLogger = {warn: (msg: string) => void};

export const safeClosePluginView = async (view: ClosablePluginView, logger: WarnLogger): Promise<void> => {
  try {
    await view.closePluginView();
  } catch (e) {
    logger.warn(`closePluginView threw: ${(e as Error).message}`);
  }
};
