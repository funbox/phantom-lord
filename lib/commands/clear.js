const { debug } = require('../utils');
const { STATUS } = require('../utils/constants');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 */
module.exports = async function clear(context, selector) {
  const errorWithUsefulStack = new Error();
  const elem = await findOne(context.page, selector);

  if (!elem) {
    debug(`clear error: ${STATUS.NOT_FOUND}`, 'error');
    throw errorWithUsefulStack;
  }

  await context.page.evaluate((selectorEl) => {
    const el = document.querySelector(selectorEl);
    el.focus();
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
  }, selector);

  const valueLength = (await (await elem.getProperty('value')).jsonValue()).length;
  for (let i = 0; i < valueLength; i += 1) {
    /* eslint-disable no-await-in-loop */
    await context.page.keyboard.press('Backspace');
    /* eslint-enable no-await-in-loop */
  }
};
