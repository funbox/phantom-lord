const checkCmd = require('../utils/checkCommand');
const initializePage = require('../page/initialize');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} url
 */
module.exports = async function open(context, url) {
  const errorWithUsefulStack = new Error();

  if (context.state === 'notStarted') {
    await context.startRemoteBrowser();
  }

  if (!context.isInitialized) {
    await initializePage(context);
  }
  //

  try {
    await context.page.goto(url);
  } catch (e) {
    errorWithUsefulStack.message = `open page error: ${e.message}`;
    throw errorWithUsefulStack;
  }
};
