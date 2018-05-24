const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @returns {Promise<number>}
 */
module.exports = async function getCount(selector) {
  checkCmd.call(this, { name: 'getCount', params: { selector } });

  const elements = await this.pageUtils.findAll(selector);
  return elements.length;
};
