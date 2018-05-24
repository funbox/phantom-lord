/**
 * @param {string|{type: string, path: string}} selector
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitForSelector(selector, onTimeout) {
  return this.waitFor(() => this.checkSelectorExists(selector), onTimeout);
};
