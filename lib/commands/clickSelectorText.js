const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {string} text
 */
module.exports = function clickSelectorText(selector, text) {
  const errorWithUsefulStack = new Error();
  return this.then(async () => {
    const throwError = (status) => {
      debug(`debug: clickSelectorText error: ${status}`);
      errorWithUsefulStack.message = `clickSelectorText(${selector}, ${text}): ${status}`;
      throw errorWithUsefulStack;
    };

    checkCmd.call(this, { name: 'clickSelectorText', params: { selector, text } });

    let visibleElement;
    let matchedByTextElement;
    const els = await this.pageUtils.findAll(selector);

    if (els.length === 0) {
      throwError(STATUS.NOT_FOUND);
    }

    for (const el of els) { // eslint-disable-line no-restricted-syntax
      const elementText = await this.pageUtils.fetchTextFromElement(el);

      if (elementText === text) {
        matchedByTextElement = el;

        if (await this.pageUtils.visible(el)) {
          visibleElement = el;
          break;
        }
      }
    }

    if (!matchedByTextElement) {
      throwError(STATUS.NOT_FOUND);
    }

    if (!visibleElement) {
      throwError(STATUS.INVISIBLE);
    }

    try {
      await visibleElement.click();
    } catch (e) {
      debug(e);
      throwError('clickError');
    }
  });
};
