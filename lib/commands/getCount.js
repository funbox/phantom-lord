const findAll = require('../page/findAll');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @returns {Promise<number>}
 */
module.exports = async function getCount(context, selector) {
  const elements = await findAll(context.page, selector);
  return elements.length;
};
