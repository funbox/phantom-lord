const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');
const findAll = require('../page/findAll');
const fetchTextFromElement = require('../page/fetchTextFromElement');
const visible = require('../page/visible');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string} text
 */
module.exports = function clickSelectorText(context, selector, text) {
  const errorWithUsefulStack = new Error();
  return context.then(async () => {
    const throwError = (status) => {
      debug(`debug: clickSelectorText error: ${status}`);
      errorWithUsefulStack.message = `clickSelectorText(${selector}, ${text}): ${status}`;
      throw errorWithUsefulStack;
    };

    checkCmd(context, { name: 'clickSelectorText', params: { selector, text } });

    let visibleElement;
    let matchedByTextElement;
    const els = await findAll(context.page, selector);

    if (els.length === 0) {
      throwError(STATUS.NOT_FOUND);
    }

    for (const el of els) { // eslint-disable-line no-restricted-syntax
      const elementText = await fetchTextFromElement(context, el);

      if (elementText === text) {
        matchedByTextElement = el;

        if (await visible(context, el)) {
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
