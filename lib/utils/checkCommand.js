const debug = require('./debug');
const { STATE } = require('./constants');

const allowedBeforeBrowserStart = ['addStubToQueue', 'addCookieToQueue', 'addLocalStorageItemToQueue', 'addTestSetting', 'open'];

/**
 * @param {!RemoteBrowser=} context
 * @param {string} cmdName
 * @param {boolean} skipBrowserErrorsCheck
 * @param {...*} cmdArgs
 * @returns {null|Error}
 */
const checkCmd = function checkCommand(context, cmdName, skipBrowserErrorsCheck, ...cmdArgs) {
  debug(`received cmd ${context.cmdId}: ${cmdName}`, 'info');

  if (context.state !== STATE.STARTED && !allowedBeforeBrowserStart.includes(cmdName)) {
    console.log(`Can't process cmd because browser state = ${context.state}`);
    throw new Error('Browser not started');
  }

  if (!context.page && !allowedBeforeBrowserStart.includes(cmdName)) {
    throw new Error('Page is not initialized');
  }

  if (context.browserErrors.length > 0 && !skipBrowserErrorsCheck) {
    const browserError = context.browserErrors[0];
    console.log('Browser error occurred');
    context.browserErrors = [];
    throw new Error(browserError.msg);
  }

  debug(`processing cmd: ${JSON.stringify({ name: cmdName, params: cmdArgs })}`, 'info');
  return null;
};

module.exports = checkCmd;
