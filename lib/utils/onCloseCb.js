const debug = require('./debug');

const onCloseCb = function onCloseCb(cbType, code, signal) {
  debug(`Puppeteer ${this.pid} ${cbType}ed with code: ${code}, signal: ${signal}`);
  this.emit(cbType, code, signal);
  this.state = 'notStarted';
  this.isInitialized = false;
  this.chromium = null;
};

module.exports = onCloseCb;
