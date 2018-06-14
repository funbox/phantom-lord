const checkCmd = require('../utils/checkCommand');
const STATUS = require('../utils/constants');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 */
module.exports = async function scrollSelectorToBottom(context, selector) {
  checkCmd(context, 'scrollSelectorToBottom', selector);

  const element = await findOne(context.page, selector);

  if (!element) {
    throw new Error(`scrollSelectorToBottom error: ${STATUS.NOT_FOUND}`);
  }

  await context.page.evaluate((e) => {
    e.scrollTop = e.scrollHeight;
  }, element);
};
