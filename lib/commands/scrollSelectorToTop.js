const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');

/**
 * @param {string|{type: string, path: string}} selector
 */
module.exports = function scrollSelectorToTop(selector) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'scrollSelectorToTop', params: { selector } });

    const element = await this.pageUtils.findOne(selector);

    if (!element) {
      throw new Error(`scrollSelectorToTop error: ${STATUS.NOT_FOUND}`);
    }

    await this.page.evaluate((e) => {
      e.scrollTop = 0;
    }, element);
  });
};
