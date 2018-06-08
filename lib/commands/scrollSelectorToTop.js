const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 */
module.exports = function scrollSelectorToTop(context, selector) {
  return context.then(async () => {
    checkCmd(context, { name: 'scrollSelectorToTop', params: { selector } });

    const element = await findOne(context.page, selector);

    if (!element) {
      throw new Error(`scrollSelectorToTop error: ${STATUS.NOT_FOUND}`);
    }

    await context.page.evaluate((e) => {
      e.scrollTop = 0;
    }, element);
  });
};
