import type {Logger} from '../sdk/types';

export type ButtonEvent = {id: number};

export type ButtonListener = {
  onButtonPress: (event: ButtonEvent) => void;
};

export type PluginManagerLike = {
  registerButton: (type: number, appTypes: string[], button: object) => Promise<boolean>;
  registerButtonListener: (listener: ButtonListener) => unknown;
  setButtonState: (id: number, state: boolean) => Promise<boolean>;
  getPluginDirPath: () => Promise<string | null | undefined>;
};

export const ICON_FILENAME = 'icon.png';

export const resolveIconUri = async (
  pluginManager: Pick<PluginManagerLike, 'getPluginDirPath'>,
  logger: Pick<Logger, 'warn'>,
  tag: string,
  filename: string = ICON_FILENAME,
): Promise<string> => {
  let pluginDir: string | null | undefined;
  try {
    pluginDir = await pluginManager.getPluginDirPath();
  } catch (e) {
    logger.warn(`[${tag}:icon] getPluginDirPath threw: ${(e as Error).message} — registering without icon`);
    pluginDir = null;
  }
  const iconUri = pluginDir ? `file://${pluginDir}/${filename}` : '';
  if (!iconUri) {
    logger.warn(`[${tag}:icon] no plugin dir available — button will render without icon`);
  }
  return iconUri;
};
