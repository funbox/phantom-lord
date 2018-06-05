const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');

/**
 * @param {string|{type: string, path: string}} selector
 */
module.exports = function scrollSelectorToBottom(selector) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'scrollSelectorToBottom', params: { selector } });

    const element = await this.pageUtils.findOne(selector);

    if (!element) {
      throw new Error(`scrollSelectorToBottom error: ${STATUS.NOT_FOUND}`);
    }

    await this.page.evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    }, element);
  });
};
