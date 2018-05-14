module.exports = function waitWhileVisible(selector, onTimeout) {
  return this.waitFor(() => this.checkVisibility(selector), onTimeout);
};
