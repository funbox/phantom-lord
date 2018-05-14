const checkCmd = require('../utils/checkCommand');

module.exports = function scrollSelectorToTop(selector) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'scrollSelectorToTop', params: { selector } });

    const element = await this.pageUtils.findOne(selector);
    await this.page.evaluate((e) => {
      e.scrollTop = 0;
    }, element);
  });
};
