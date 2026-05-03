// Single lasso-toolbar button. showType:1 mounts the React popup as a
// centered dialog. editDataTypes=[3] (text-box) restricts the button
// to selections that contain text boxes only — when the user lassos
// strokes / shapes / images, the firmware filters the button out of
// the lasso menu, which is exactly what we want for a "multi text
// style" tool.
//
// Per the firmware filter docs, the button shows iff the selection's
// type set is a subset of editDataTypes. So a pure text-box selection
// gets the button; any mixed selection won't.

import {resolveIconUri, type ButtonEvent, type ButtonListener, type PluginManagerLike} from './buttonCommon';
import {localizedLassoButtonName} from '../i18n/i18n';
import type {Logger} from '../sdk/types';

const BUTTON_TYPE_LASSO_TOOLBAR = 2;
const APP_TYPE_NOTE = 'NOTE';
const EDIT_DATA_TYPES_TEXT_BOX_ONLY = [3];

export const LASSO_TEXT_STYLE_BUTTON_ID = 301;

export type RegisterLassoDeps = {
  pluginManager: PluginManagerLike;
  onPress: (event: ButtonEvent) => void;
  logger: Pick<Logger, 'log' | 'warn'>;
};

const TAG = 'mtstyle:button';

export const registerLassoButton = async (deps: RegisterLassoDeps): Promise<void> => {
  const iconUri = await resolveIconUri(deps.pluginManager, deps.logger, TAG);

  await deps.pluginManager.registerButton(BUTTON_TYPE_LASSO_TOOLBAR, [APP_TYPE_NOTE], {
    id: LASSO_TEXT_STYLE_BUTTON_ID,
    name: localizedLassoButtonName(),
    icon: iconUri,
    enable: true,
    editDataTypes: EDIT_DATA_TYPES_TEXT_BOX_ONLY,
    showType: 1,
    regionType: 1,
    regionWidth: 600,
    regionHeight: 720,
  });

  deps.logger.log(`[${TAG}] registered LASSO Multi Text Style button (id=${LASSO_TEXT_STYLE_BUTTON_ID})`);

  const listener: ButtonListener = {
    onButtonPress: event => {
      if (event.id === LASSO_TEXT_STYLE_BUTTON_ID) {
        deps.onPress(event);
      }
    },
  };
  deps.pluginManager.registerButtonListener(listener);
};
