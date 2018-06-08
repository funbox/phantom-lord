const debug = require('./debug');

/**
 * @callback RemoteBrowser~onCloseCb
 * @this RemoteBrowser
 * @param {string} cbType - 'close' или 'exit'
 * @param {number} code
 * @param {string} signal
 */
const onCloseCb = function onCloseCb(context, cbType, code, signal) {
  debug(`Puppeteer ${context.pid} ${cbType}ed with code: ${code}, signal: ${signal}`);
  context.emit(cbType, code, signal);
  context.state = 'notStarted';
  context.isInitialized = false;
  context.chromium = null;
};

module.exports = onCloseCb;
