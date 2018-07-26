const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');
const performMouseAction = require('../page/performMouseAction');
/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {number} elementX
 * @param {number} elementY
 */
module.exports = function hover(context, selector, elementX, elementY) {
  const errorWithUsefulStack = new Error();
  return context.then(async () => {
    checkCmd(context, 'hover', selector, elementX, elementY);

    const resp = await performMouseAction(context, 'hover', selector, elementX, elementY);

    if (resp.status !== STATUS.OK) {
      debug(`hover error: ${resp.status}`, 'error');
      errorWithUsefulStack.message = `hover(${selector} error: ${resp.status})`;
      throw errorWithUsefulStack;
    }
  });
};
