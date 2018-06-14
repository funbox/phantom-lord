const checkCmd = require('../utils/checkCommand');
const findOne = require('../page/findOne');
const visible = require('../page/visible');

/**
 * @param {string} expectedState - 'visible' or 'invisible'
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @returns {Promise<void>}
 */
module.exports = async function expectVisibilityState(expectedState = 'visible', context, selector) {
  checkCmd(context, 'expectVisibilityState', selector);

  const el = await findOne(context.page, selector);

  if (!el) {
    if (expectedState === 'visible') throw new Error(`Expected selector '${selector}' not found`);
    return;
  }

  const isVisible = await visible(context, el, true);

  if (!isVisible && expectedState === 'visible') {
    throw new Error(`Expected selector '${selector}' is not visible`);
  } else if (isVisible && expectedState === 'invisible') {
    throw new Error(`Expected selector '${selector}' is visible`);
  }
};
