module.exports = function waitUntilVisible(selector, onTimeout) {
  return this.waitFor(() => this.checkVisibility(selector, false), onTimeout);
};
