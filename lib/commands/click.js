const { STATUS } = require('../utils/constants');
const { debug } = require('../utils');
const performMouseAction = require('../page/performMouseAction');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {number=} elementX
 * @param {number=} elementY
 */
module.exports = async function click(context, selector, elementX, elementY) {
  const errorWithUsefulStack = new Error();
  const resp = await performMouseAction(context, 'click', selector, elementX, elementY);

  if (resp.status !== STATUS.OK) {
    debug(`click error: ${resp.status}`, 'error');
    errorWithUsefulStack.message = `click(${selector} error: ${resp.status})`;
    throw errorWithUsefulStack;
  }
};
