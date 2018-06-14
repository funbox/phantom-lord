const waitFor = require('./waitFor');
const checkSelectorValue = require('./checkSelectorValue');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {*} expectedValue
 * @param {boolean=} exactMatch
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForSelectorValue(context, selector, expectedValue, exactMatch, onTimeout) {
  return waitFor(context, () => checkSelectorValue(context, selector, expectedValue),
    'waitForSelectorValue', onTimeout);
};
