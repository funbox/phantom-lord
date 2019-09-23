const findOne = require('../page/findOne');
const { STATUS } = require('../utils/constants');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {*} value
 * @returns {Promise<void>}
 */
module.exports = async function checkSelectorValue(context, selector, value) {
  const el = await findOne(context.page, selector);

  if (!el) {
    throw new Error(`checkSelectorValue error: ${STATUS.NOT_FOUND}`);
  }

  const res = await context.page.evaluate(e => e.value, el);

  if (res !== value) {
    throw new Error(`Expected value of '${selector}' to be '${value}', but it was '${res}'`);
  }
};
