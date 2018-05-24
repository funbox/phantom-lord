const { debug, checkCmd } = require('../utils');
const STATUS = require('../utils/constants');

/**
 * @param {string|{type: string, path: string}} selector
 * @param {string} keys
 */
module.exports = function sendKeys(selector, keys) {
  const errorWithUsefulStack = new Error();
  this.click(selector);
  return this.then(async () => {
    checkCmd.call(this, { name: 'sendKeys', params: { selector, keys } });

    const elem = await this.pageUtils.findOne(selector);
    if (!elem) {
      debug(`sendKeys error: ${STATUS.NOT_FOUND}`);
      errorWithUsefulStack.message = `sendKeys(${selector}, ${keys})`;
      throw errorWithUsefulStack;
    }
    await elem.type(keys);
  });
};
