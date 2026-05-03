/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {PluginCommAPI, PluginNoteAPI, PluginManager} from 'sn-plugin-lib';

import {registerLassoButton, LASSO_TEXT_STYLE_BUTTON_ID} from './src/buttons/registerLassoButton';
import {onLassoMain} from './src/handlers/onLassoMain';

AppRegistry.registerComponent(appName, () => App);

PluginManager.init();

// The firmware suppresses console.warn / console.error from logcat
// (every ReactNativeJS line is at info level). Tag levels manually.
const logger = {
  log: msg => console.log(msg),
  warn: msg => console.log(`[WARN] ${msg}`),
  error: msg => console.log(`[ERROR] ${msg}`),
};

const lassoComm = {
  getLassoRect: () => PluginCommAPI.getLassoRect(),
  setLassoBoxState: state => PluginCommAPI.setLassoBoxState(state),
  closePluginView: () => PluginManager.closePluginView(),
};

const noteApi = {
  getLassoText: () => PluginNoteAPI.getLassoText(),
  modifyLassoText: textBox => PluginNoteAPI.modifyLassoText(textBox),
};

const lassoDeps = {
  comm: lassoComm,
  noteApi,
  logger,
};

const onButtonPress = event => {
  if (event.id === LASSO_TEXT_STYLE_BUTTON_ID) {
    onLassoMain(lassoDeps).catch(e => {
      logger.error(`[mtstyle:lasso] dispatch crashed: ${e.message}`);
    });
  }
};

registerLassoButton({
  pluginManager: PluginManager,
  onPress: onButtonPress,
  logger,
}).catch(e => {
  logger.error(`[mtstyle:init] button registration failed: ${e.message}`);
});
