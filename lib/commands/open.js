const initializePage = require('../page/initialize');
const openPage = require('../page/open');
const { STATE } = require('../utils/constants');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} url
 * @param {Object=} options
 */
module.exports = async function open(context, url, options) {
  const errorWithUsefulStack = new Error();

  if (context.state === STATE.NOT_STARTED) {
    await context.startRemoteBrowser();
  }

  if (!context.page) {
    context.page = await openPage(context);
  }

  if (!context.isInitialized) {
    await initializePage(context);
  }

  try {
    await context.page.goto(url, options);
  } catch (e) {
    errorWithUsefulStack.message = `open page error: ${e.message}`;
    throw errorWithUsefulStack;
  }
};
