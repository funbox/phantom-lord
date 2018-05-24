/**
 * @param {string} formSelector
 * @param {Object} vals
 * @param {boolean=} submit
 */
module.exports = function fillSelectors(formSelector, vals, submit) {
  return this.fillForm(formSelector, vals, {
    submit,
    selectorType: 'css',
  });
};
