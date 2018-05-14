const checkCmd = require('../utils/checkCommand');

module.exports = async function checkSelectorText(selector, text, exactMatch) {
  checkCmd.call(this, { name: 'checkSelectorText', params: { selector, text } });

  let elementText = '';
  const elements = await this.pageUtils.findAll(selector);

  if (elements && elements.length) {
    for (const element of elements) { // eslint-disable-line no-restricted-syntax
      elementText += await this.pageUtils.fetchTextFromElement(element);
    }
  }

  if ((exactMatch && elementText !== text) || (!exactMatch && elementText.indexOf(text) === -1)) {
    throw new Error(`Expected text of '${selector}' to be '${text}', but it was '${elementText}'`);
  }
};
