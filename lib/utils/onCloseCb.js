const debug = require('./debug');

/**
 * @callback RemoteBrowser~onCloseCb
 * @this RemoteBrowser
 * @param {string} cbType - 'close' или 'exit'
 * @param {number} code
 * @param {string} signal
 */
const onCloseCb = function onCloseCb(cbType, code, signal) {
  debug(`Puppeteer ${this.pid} ${cbType}ed with code: ${code}, signal: ${signal}`);
  this.emit(cbType, code, signal);
  this.state = 'notStarted';
  this.isInitialized = false;
  this.chromium = null;
};

module.exports = onCloseCb;
