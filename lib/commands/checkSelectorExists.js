const checkCmd = require('../utils/checkCommand');
const findAll = require('../page/findAll');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {boolean=} shouldExist
 * @returns {Promise<void>}
 */
module.exports = async function checkSelectorExists(context, selector, shouldExist = true) {
  checkCmd(context, 'checkSelectorExists', selector);

  const res = await findAll(context.page, selector);
  if (shouldExist && res.length === 0) {
    throw new Error(`Expected selector '${selector}' do not exist`);
  }

  if (!shouldExist && res.length > 0) {
    throw new Error(`Expected selector '${selector}' exists`);
  }
};
