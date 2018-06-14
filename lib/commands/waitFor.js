const debug = require('../utils/debug');

/**
 * @param {!RemoteBrowser=} context
 * @param {Function} fn
 * @param {String} fnName
 * @param {Function=} onTimeout
 */
module.exports = async function waitFor(context, fn, fnName, onTimeout) {
  const errorWithUsefulStack = new Error();
  const startWaitingTime = +new Date();
  let currentTime;

  do {
    try {
      await fn();
      return;
    } catch (error) {
      currentTime = +new Date();
      errorWithUsefulStack.message = error;
    }

    await (async () => new Promise((resolve) => {
      setTimeout(resolve, context.CHECK_INTERVAL);
    }))();
  } while (currentTime - startWaitingTime < context.WAIT_TIMEOUT);

  onTimeout && onTimeout(); // eslint-disable-line no-unused-expressions
  debug(`processing command "${fnName}" failed`, 'error');
  console.log('e2e-tests timeout!');
  throw errorWithUsefulStack;
};
