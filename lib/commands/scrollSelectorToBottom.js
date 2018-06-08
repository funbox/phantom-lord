const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');
const findOne = require('../page/findOne');

/**
 * @param {string|{type: string, path: string}} selector
 */
module.exports = function scrollSelectorToBottom(context, selector) {
  return context.then(async () => {
    checkCmd(context, { name: 'scrollSelectorToBottom', params: { selector } });

    const element = await findOne(context.page, selector);

    if (!element) {
      throw new Error(`scrollSelectorToBottom error: ${STATUS.NOT_FOUND}`);
    }

    await context.page.evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    }, element);
  });
};
