/**
 * @param {string|{type: string, path: string}} selector
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitWhileVisible(selector, onTimeout) {
  return this.waitFor(() => this.checkVisibility(selector), onTimeout);
};
