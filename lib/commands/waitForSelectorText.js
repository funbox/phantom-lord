/**
 * @param {string|{type: string, path: string}} selector
 * @param {string} expectedText
 * @param {boolean=} exactMatch
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitForSelectorText(selector, expectedText, exactMatch, onTimeout) {
  return this.waitFor(() => this.checkSelectorText(selector, expectedText, exactMatch), onTimeout);
};
