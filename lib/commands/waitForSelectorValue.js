/**
 * @param {string|{type: string, path: string}} selector
 * @param {*} expectedValue
 * @param {boolean=} exactMatch
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitForSelectorValue(selector, expectedValue, exactMatch, onTimeout) {
  return this.waitFor(() => this.checkSelectorValue(selector, expectedValue, exactMatch), onTimeout);
};
