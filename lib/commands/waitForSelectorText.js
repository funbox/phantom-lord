const waitFor = require('./waitFor');
const checkSelectorText = require('./checkSelectorText');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {string|number} expectedText
 * @param {boolean=} exactMatch
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForSelectorText(context, selector, expectedText, exactMatch, onTimeout) {
  return waitFor(context, () => checkSelectorText(context, selector, expectedText, exactMatch),
    'waitForSelectorText', onTimeout);
};
