const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');
const mouseEvent = require('../page/mouseEvent');
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

    const resp = await mouseEvent(context, 'hover', selector, elementX, elementY);

    if (resp.status !== STATUS.OK) {
      debug(`hover error: ${resp.status}`);
      errorWithUsefulStack.message = `hover(${selector} error: ${resp.status})`;
      throw errorWithUsefulStack;
    }
  });
};
