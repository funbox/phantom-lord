const checkCmd = require('../utils/checkCommand');
const findOne = require('../page/findOne');
const visible = require('../page/visible');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {boolean=} shouldBeVisible
 * @returns {Promise<void>}
 */
module.exports = async function checkVisibility(context, selector, shouldBeVisible = true) {
  checkCmd(context, { name: 'checkVisibility', params: { selector } });

  const el = await findOne(context.page, selector);

  if (!el) {
    if (shouldBeVisible) throw new Error(`Expected selector '${selector}' not found`);
    return;
  }

  const isVisible = await visible(context, el, true);

  if (!isVisible && shouldBeVisible) {
    throw new Error(`Expected selector '${selector}' is not visible`);
  } else if (isVisible && !shouldBeVisible) {
    throw new Error(`Expected selector '${selector}' is visible`);
  }
};
