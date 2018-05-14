module.exports = function fillSelectors(formSelector, vals, submit) {
  return this.fillForm(formSelector, vals, {
    submit,
    selectorType: 'css',
  });
};
