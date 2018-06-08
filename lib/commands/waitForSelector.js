const waitFor = require('./waitFor');
const checkSelectorExists = require('./checkSelectorExists');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitForSelector(context, selector, onTimeout) {
  return waitFor(context, () => checkSelectorExists(context, selector), onTimeout);
};
