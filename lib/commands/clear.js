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

  await context.page.evaluate(selectorEl => {
    const el = document.querySelector(selectorEl);
    el.focus();
    if (el.setSelectionRange) {
      const elType = el.getAttribute('type');
      el.setAttribute('type', 'text'); // setSelectionRange is not available for input[type="email"] and input[type="number"]
      el.setSelectionRange(-1, -1);
      el.setAttribute('type', elType);
    }
  }, selector);

  const valueLength = (await (await elem.getProperty('value')).jsonValue()).length;
  for (let i = 0; i < valueLength; i += 1) {
    await context.page.keyboard.press('Backspace');
  }
};
