const checkCmd = require('../utils/checkCommand');
const initializePage = require('../page/initialize');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} url
 */
module.exports = function open(context, url) {
  const errorWithUsefulStack = new Error();
  return context.then(async () => {
    if (!context.isInitialized) {
      await initializePage(context);
    }
    checkCmd(context, 'open', url);

    try {
      await context.page.goto(url);
    } catch (e) {
      errorWithUsefulStack.message = `open page error: ${e.message}`;
      throw errorWithUsefulStack;
    }
  });
};
