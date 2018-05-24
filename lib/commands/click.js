const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {number} elementX
 * @param {number} elementY
 */
module.exports = function click(selector, elementX, elementY) {
  const errorWithUsefulStack = new Error();
  return this.then(async () => {
    checkCmd.call(this, { name: 'click', params: { selector, elementX, elementY } });

    const resp = await this.pageUtils.mouseEvent('click', selector, elementX, elementY);

    if (resp.status !== STATUS.OK) {
      debug(`click error: ${resp.status}`);
      errorWithUsefulStack.message = `click(${selector} error: ${resp.status})`;
      throw errorWithUsefulStack;
    }
  });
};
