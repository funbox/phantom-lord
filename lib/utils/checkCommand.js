const debug = require('./debug');

const allowedBeforeInitialization = ['addStubToQueue', 'addCookieToQueue', 'addLocalStorageItemToQueue', 'addTestSetting', 'open'];

/**
 * @param {!RemoteBrowser=} context
 * @param {string} cmdName
 * @param {...*} cmdArgs
 * @returns {null|Error}
 */
const checkCmd = function checkCommand(context, cmdName, ...cmdArgs) {
  debug(`received cmd ${context.cmdId} ${cmdName}`, 'info');

  if (context.state !== 'started') {
    console.log(`Can't process cmd because server state = ${context.state}`);
    throw new Error('notStarted');
  }

  if (!context.page && !allowedBeforeInitialization.includes(cmdName)) {
    throw new Error('Page is not initialized');
  }

  if (context.browserErrors.length > 0) {
    context.emit('browserErrors', context.browserErrors);
    context.browserErrors = [];
    return null;
  }

  debug(`processing cmd: ${JSON.stringify({ name: cmdName, params: cmdArgs })}`, 'info');
  return null;
};

module.exports = checkCmd;
