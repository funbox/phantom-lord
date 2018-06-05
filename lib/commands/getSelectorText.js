const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {boolean=} firstOfFound
 * @returns {Promise<string>}
 */
module.exports = async function getSelectorText(selector, firstOfFound = false) {
  checkCmd.call(this, { name: 'getSelectorText', params: { selector } });

  let elementText = '';
  const elements = await this.pageUtils.findAll(selector);

  if (elements.length === 0) {
    throw new Error(`getSelectorText error: ${STATUS.NOT_FOUND}`);
  }

  for (const element of elements) { // eslint-disable-line no-restricted-syntax
    elementText += await this.pageUtils.fetchTextFromElement(element);
    if (firstOfFound) break;
  }

  return elementText;
};
