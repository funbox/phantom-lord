module.exports = function waitForSelector(selector, onTimeout) {
  return this.waitFor(() => this.checkSelectorExists(selector), onTimeout);
};
