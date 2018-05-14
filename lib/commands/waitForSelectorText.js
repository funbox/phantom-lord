module.exports = function waitForSelectorText(selector, expectedText, exactMatch, onTimeout) {
  return this.waitFor(() => this.checkSelectorText(selector, expectedText, exactMatch), onTimeout);
};
