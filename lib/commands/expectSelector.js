const findAll = require('../page/findAll');

/**
 * @param {string} expectedState - 'exists' or 'notExists'
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @returns {Promise<void>}
 */
module.exports = async function expectSelector(expectedState = 'exists', context, selector) { // eslint-disable-line default-param-last
  const res = await findAll(context.page, selector);
  if (expectedState === 'exists' && res.length === 0) {
    throw new Error(`Expected selector '${selector}' do not exist`);
  }

  if (expectedState === 'notExists' && res.length > 0) {
    throw new Error(`Expected selector '${selector}' exists`);
  }
};
