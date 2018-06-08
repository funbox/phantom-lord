const debug = require('./debug');

const allowedBeforeInitialization = ['addStubToQueue', 'addCookieToQueue', 'addLocalStorageItemToQueue', 'addTestSetting', 'open'];

/**
 * @param {!RemoteBrowser=} context
 * @param {{name: string, params: Object}} cmd
 * @returns {null|Error}
 */
const checkCmd = function checkCommand(context, cmd) {
  context.cmdId += 1;
  debug(`received cmd ${context.cmdId} ${cmd.name}`);

  if (context.state !== 'started') {
    console.log(`Can't process cmd because server state = ${context.state}`);
    throw new Error('notStarted');
  }

  if (!context.page && !allowedBeforeInitialization.includes(cmd.name)) {
    throw new Error('Page is not initialized');
  }

  if (context.browserErrors.length > 0) {
    context.emit('browserErrors', context.browserErrors);
    context.browserErrors = [];
    return null;
  }

  debug(`processing cmd: ${JSON.stringify(cmd)}`);
  return null;
};

module.exports = checkCmd;
