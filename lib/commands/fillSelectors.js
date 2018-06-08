const fillForm = require('./fillForm');

/**
 * @param {string} formSelector
 * @param {Object} vals
 * @param {boolean=} submit
 */
module.exports = function fillSelectors(context, formSelector, vals, submit) {
  return fillForm(context, formSelector, vals, {
    submit,
    selectorType: 'css',
  });
};
