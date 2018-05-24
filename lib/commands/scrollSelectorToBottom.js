const checkCmd = require('../utils/checkCommand');

/**
 * @param {string|{type: string, path: string}} selector
 */
module.exports = function scrollSelectorToBottom(selector) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'scrollSelectorToBottom', params: { selector } });

    const element = await this.pageUtils.findOne(selector);
    await this.page.evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    }, element);
  });
};
