const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');
const findAll = require('../page/findAll');
const fetchTextFromElement = require('../page/fetchTextFromElement');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {boolean=} firstOfFound
 * @returns {Promise<string>}
 */
module.exports = async function getSelectorText(context, selector, firstOfFound = false) {
  checkCmd(context, 'getSelectorText', selector);

  let elementText = '';
  const elements = await findAll(context.page, selector);

  if (elements.length === 0) {
    throw new Error(`getSelectorText error: ${STATUS.NOT_FOUND}`);
  }

  for (const element of elements) { // eslint-disable-line no-restricted-syntax
    elementText += await fetchTextFromElement(context, element);
    if (firstOfFound) break;
  }

  return elementText;
};
