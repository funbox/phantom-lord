const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');

module.exports = function hover(selector, elementX, elementY) {
  const errorWithUsefulStack = new Error();
  return this.then(async () => {
    checkCmd.call(this, { name: 'hover', params: { selector, elementX, elementY } });

    const resp = await this.pageUtils.mouseEvent('hover', selector, elementX, elementY);

    if (resp.status !== STATUS.OK) {
      debug(`hover error: ${resp.status}`);
      errorWithUsefulStack.message = `hover(${selector} error: ${resp.status})`;
      throw errorWithUsefulStack;
    }
  });
};
