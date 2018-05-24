const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {boolean=} shouldBeVisible
 * @returns {Promise<void>}
 */
module.exports = async function checkVisibility(selector, shouldBeVisible = true) {
  checkCmd.call(this, { name: 'checkVisibility', params: { selector } });

  const el = await this.pageUtils.findOne(selector);

  if (!el) {
    if (shouldBeVisible) throw new Error(`Expected selector '${selector}' not found`);
    return;
  }

  const isVisible = await this.pageUtils.visible(el, true);

  if (!isVisible && shouldBeVisible) {
    throw new Error(`Expected selector '${selector}' is not visible`);
  } else if (isVisible && !shouldBeVisible) {
    throw new Error(`Expected selector '${selector}' is visible`);
  }
};
