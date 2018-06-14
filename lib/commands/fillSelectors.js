const fillForm = require('./fillForm');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} formSelector
 * @param {Object} vals
 * @param {boolean=} submit
 */
module.exports = async function fillSelectors(context, formSelector, vals, submit) {
  return fillForm(context, formSelector, vals, {
    submit,
    selectorType: 'css',
  });
};
