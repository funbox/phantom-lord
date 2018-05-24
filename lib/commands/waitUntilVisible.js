/**
 * @param {string|{type: string, path: string}}  selector
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitUntilVisible(selector, onTimeout) {
  return this.waitFor(() => this.checkVisibility(selector, false), onTimeout);
};
