const STATUS = require('../utils/constants');
const { debug, checkCmd } = require('../utils');
const mouseEvent = require('../page/mouseEvent');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {number=} elementX
 * @param {number=} elementY
 */
module.exports = function click(context, selector, elementX, elementY) {
  const errorWithUsefulStack = new Error();
  return context.then(async () => {
    checkCmd(context, { name: 'click', params: { selector, elementX, elementY } });

    const resp = await mouseEvent(context, 'click', selector, elementX, elementY);

    if (resp.status !== STATUS.OK) {
      debug(`click error: ${resp.status}`);
      errorWithUsefulStack.message = `click(${selector} error: ${resp.status})`;
      throw errorWithUsefulStack;
    }
  });
};
