const { debug } = require('../utils');
const { STATUS } = require('../utils/constants');
const click = require('./click');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string} keys
 */
module.exports = async function sendKeys(context, selector, keys) {
  const errorWithUsefulStack = new Error();
  await click(context, selector);

  const elem = await findOne(context.page, selector);
  if (!elem) {
    debug(`sendKeys error: ${STATUS.NOT_FOUND}`, 'error');
    errorWithUsefulStack.message = `sendKeys(${selector}, ${keys})`;
    throw errorWithUsefulStack;
  }
  await elem.type(keys);
};
