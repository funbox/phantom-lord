const waitFor = require('./waitFor');
const checkSelectorValue = require('./checkSelectorValue');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {*} expectedValue
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForSelectorValue(context, selector, expectedValue, onTimeout) {
  return waitFor(context, () => checkSelectorValue(context, selector, expectedValue), 'waitForSelectorValue', onTimeout);
};
