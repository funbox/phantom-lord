module.exports = function waitWhileSelector(selector, onTimeout) {
  return this.waitFor(() => this.checkSelectorExists(selector, false), onTimeout);
};
