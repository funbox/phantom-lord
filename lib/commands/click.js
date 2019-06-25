const { STATUS } = require('../utils/constants');
const { debug } = require('../utils');
const performMouseAction = require('../page/performMouseAction');
const waitFor = require('./waitFor');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {number=} elementX
 * @param {number=} elementY
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function click(context, selector, elementX, elementY, onTimeout) {
  return waitFor(context, async () => {
    const errorWithUsefulStack = new Error();
    const resp = await performMouseAction(context, 'click', selector, elementX, elementY);

    if (resp.status !== STATUS.OK) {
      debug(`click error: ${resp.status}`, 'error');
      errorWithUsefulStack.message = `click(${selector} error: ${resp.status})`;
      throw errorWithUsefulStack;
    }
  }, 'click', onTimeout);
};
