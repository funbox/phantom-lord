const fse = require('fs-extra');
const { debug } = require('../utils');
const fill = require('./fill');
const findOne = require('../page/findOne');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} formSelector
 * @param {Object} vals
 * @param {Object=} options
 */
module.exports = async function fillForm(context, formSelector, vals, options) {
  const errorWithUsefulStack = new Error();
  const throwError = (status) => {
    errorWithUsefulStack.message = `fillForm('${formSelector}', '${vals}', '${options}'): ${status}`;
    throw errorWithUsefulStack;
  };

  const selectorType = (options && options.selectorType) || 'names';

  if (formSelector.type && formSelector.type === 'xpath') {
    debug('Error: fillForm does not support xpath, use a CSS selector instead', 'error');
    throwError('fillForm does not support xpath');
  }

  const fillResults = await fill(context, formSelector, vals, selectorType);
  if (!fillResults) {
    throwError();
  }

  if (fillResults.errors.length > 0) {
    debug('Error: an error has occurred while filling one or more fields', 'error');
    debug(fillResults.errors.join('\n'), 'error');
    throwError('fields filling error');
  }

  if (fillResults.files && fillResults.files.length > 0) {
    for (const file of fillResults.files) { // eslint-disable-line no-restricted-syntax
      if (file && file.path) {
        if (!(fse.existsSync(file.path))) {
          debug('Error: can not upload non existed file', 'error');
          throwError('can not upload non existed file');
        }

        let fileFieldSelector;
        if (file.type === 'names') {
          fileFieldSelector = [formSelector, `input[name="${file.selector}"]`].join(' ');
        } else if (file.type === 'css' || file.type === 'labels') {
          fileFieldSelector = [formSelector, file.selector].join(' ');
        }
        const fileInput = await findOne(context.page, fileFieldSelector);
        await fileInput.uploadFile(file.path);
      }
    }
  }
};
