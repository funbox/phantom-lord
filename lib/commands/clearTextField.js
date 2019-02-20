const { debug } = require('../utils');
const { STATUS } = require('../utils/constants');
const click = require('./click');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 */
module.exports = async function clearTextField(context, selector) {
  const errorWithUsefulStack = new Error();
  await click(context, selector);

  const elem = await findOne(context.page, selector);
  if (!elem) {
    debug(`clearTextField error: ${STATUS.NOT_FOUND}`, 'error');
    throw errorWithUsefulStack;
  }

  const valueLength = (await (await elem.getProperty('value')).jsonValue()).length;
  for (let i = 0; i < valueLength; i += 1) {
    /* eslint-disable no-await-in-loop */
    await context.page.keyboard.press('Backspace');
    /* eslint-enable no-await-in-loop */
  }
};
