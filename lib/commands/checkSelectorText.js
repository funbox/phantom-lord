const checkCmd = require('../utils/checkCommand');
const findAll = require('../page/findAll');
const fetchTextFromElement = require('../page/fetchTextFromElement');
const STATUS = require('../utils/constants');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string} text
 * @param {boolean=} exactMatch
 * @returns {Promise<void>}
 */
module.exports = async function checkSelectorText(context, selector, text, exactMatch) {
  checkCmd(context, { name: 'checkSelectorText', params: { selector, text } });

  let elementText = '';
  const elements = await findAll(context.page, selector);

  if (elements.length === 0) {
    throw new Error(`checkSelectorText error: ${STATUS.NOT_FOUND}`);
  }

  for (const element of elements) { // eslint-disable-line no-restricted-syntax
    elementText += await fetchTextFromElement(context, element);
  }

  if ((exactMatch && elementText !== text) || (!exactMatch && elementText.indexOf(text) === -1)) {
    throw new Error(`Expected text of '${selector}' to be '${text}', but it was '${elementText}'`);
  }
};
