const checkCmd = require('../utils/checkCommand');

/**
 * @param {string} url
 */
module.exports = function open(url) {
  const errorWithUsefulStack = new Error();
  return this.then(async () => {
    if (!this.isInitialized) {
      await this.pageUtils.initializePage();
    }
    checkCmd.call(this, { name: 'open', params: { url } });

    try {
      await this.page.goto(url);
    } catch (e) {
      errorWithUsefulStack.message = `open page error: ${e.message}`;
      throw errorWithUsefulStack;
    }
  });
};
