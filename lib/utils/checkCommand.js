const debug = require('./debug');

const allowedBeforeInitialization = ['addStubToQueue', 'addCookieToQueue', 'addLocalStorageItemToQueue', 'addTestSetting', 'open'];

const checkCmd = function checkCommand(cmd) {
  this.cmdId += 1;
  debug(`received cmd ${this.cmdId} ${cmd.name}`);

  if (this.state !== 'started') {
    console.log(`Can't process cmd because server state = ${this.state}`);
    throw new Error('notStarted');
  }

  if (!this.page && !allowedBeforeInitialization.includes(cmd.name)) {
    throw new Error('Page is not initialized');
  }

  if (this.browserErrors.length > 0) {
    this.emit('browserErrors', this.browserErrors);
    this.browserErrors = [];
    return null;
  }

  debug(`processing cmd: ${JSON.stringify(cmd)}`);
  return null;
};

module.exports = checkCmd;
