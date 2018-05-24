const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {*} value
 * @returns {Promise<void>}
 */
module.exports = async function checkSelectorValue(selector, value) {
  checkCmd.call(this, { name: 'checkSelectorValue', params: { selector, value } });

  const el = await this.pageUtils.findOne(selector);
  const res = el ?
    (await this.page.evaluate(e => e.value, el)) : undefined;

  if (res !== value) {
    throw new Error(`Expected value of '${selector}' to be '${value}', but it was '${res}'`);
  }
};
