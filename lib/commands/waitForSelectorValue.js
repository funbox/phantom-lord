module.exports = function waitForSelectorValue(selector, expectedText, exactMatch, onTimeout) {
  return this.waitFor(() => this.checkSelectorValue(selector, expectedText, exactMatch), onTimeout);
};
