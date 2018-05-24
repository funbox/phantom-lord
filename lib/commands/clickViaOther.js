const debug = require('../utils/debug');
const STATUS = require('../utils/constants');


/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {string|{type: string, path: string}} otherSelector
 */
module.exports = function clickViaOther(selector, otherSelector) {
  const errorWithUsefulStack = new Error();
  return this.then(async () => {
    const throwError = (status) => {
      debug(`debug: clickViaOther error: ${status}`);
      errorWithUsefulStack.message = `clickViaOther(${selector}, ${otherSelector}): ${status}`;
      throw errorWithUsefulStack;
    };

    const el = await this.pageUtils.findOne(selector);
    const otherEl = await this.pageUtils.findOne(otherSelector);

    if (!el) {
      throwError(STATUS.NOT_FOUND);
    }

    if (!otherEl) {
      throwError('notFoundOther');
    }

    if (!(await this.pageUtils.visible(el))) {
      throwError(STATUS.INVISIBLE);
    }

    if (!(await this.pageUtils.visible(otherEl))) {
      throwError('invisibleElementOther');
    }

    try {
      await el.click();
    } catch (e) {
      debug(e);
      throwError('clickError');
    }
  });
};
