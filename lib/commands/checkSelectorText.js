const { replaceNbsp } = require('../utils');
const findAll = require('../page/findAll');
const fetchTextFromElement = require('../page/fetchTextFromElement');
const { STATUS } = require('../utils/constants');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string|number} text
 * @param {boolean=} exactMatch
 * @returns {Promise<void>}
 */
module.exports = async function checkSelectorText(context, selector, text, exactMatch) {
  let elementText = '';
  if (!(text instanceof String)) {
    text = String(text);
  }
  const expectedText = replaceNbsp(text);
  const elements = await findAll(context.page, selector);

  if (elements.length === 0) {
    throw new Error(`checkSelectorText error: ${STATUS.NOT_FOUND}`);
  }

  for (const element of elements) { // eslint-disable-line no-restricted-syntax
    elementText += await fetchTextFromElement(context, element);
  }

  if ((exactMatch && elementText !== expectedText) || (!exactMatch && elementText.indexOf(expectedText) === -1)) {
    throw new Error(`Expected text of '${selector}' to be '${text}', but it was '${elementText}'`);
  }
};
