const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');
const findOne = require('../page/findOne');
const visible = require('../page/visible');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string|{type: string, path: string}} otherSelector
 */
module.exports = async function clickViaOther(context, selector, otherSelector) {
  const errorWithUsefulStack = new Error();
  const throwError = (status) => {
    debug(`debug: clickViaOther error: ${status}`, 'error');
    errorWithUsefulStack.message = `clickViaOther(${selector}, ${otherSelector}): ${status}`;
    throw errorWithUsefulStack;
  };

  //

  const el = await findOne(context.page, selector);
  const otherEl = await findOne(context.page, otherSelector);

  if (!el) {
    throwError(STATUS.NOT_FOUND);
  }

  if (!otherEl) {
    throwError(`${STATUS.NOT_FOUND}Other`);
  }

  if (!(await visible(context, el))) {
    throwError(STATUS.INVISIBLE);
  }

  if (!(await visible(context, otherEl))) {
    throwError(`${STATUS.INVISIBLE}Other`);
  }

  try {
    await el.click();
  } catch (e) {
    debug(e, 'error');
    throwError('clickError');
  }
};
