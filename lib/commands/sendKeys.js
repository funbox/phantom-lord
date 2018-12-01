const { debug } = require('../utils');
const { STATUS } = require('../utils/constants');
const click = require('./click');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string} keys
 * @param {"start"|"end"|number=} caretPosition
 */
module.exports = async function sendKeys(context, selector, keys, caretPosition = 'end') {
  const errorWithUsefulStack = new Error();
  let selectionRange;
  await click(context, selector);

  const elem = await findOne(context.page, selector);
  if (!elem) {
    debug(`sendKeys error: ${STATUS.NOT_FOUND}`, 'error');
    errorWithUsefulStack.message = `sendKeys(${selector}, ${keys})`;
    throw errorWithUsefulStack;
  }
  const value = await (await elem.getProperty('value')).jsonValue();
  if (!['string', 'number'].includes(typeof caretPosition)) {
    caretPosition = 'end';
  }
  if (typeof caretPosition === 'string') {
    selectionRange = caretPosition === 'start' ? [0, 0] : [value.length, value.length];
  } else {
    selectionRange = [caretPosition, caretPosition];
  }
  await context.page.evaluate((element, range) => {
    if (element.setSelectionRange) {
      const elType = element.getAttribute('type');
      element.setAttribute('type', 'text'); // setSelectionRange не доступен для input[type="email"] и input[type="number"]
      element.setSelectionRange(...range);
      element.setAttribute('type', elType);
    }
  }, elem, selectionRange);
  await elem.type(keys);
};
