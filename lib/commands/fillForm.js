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
    debug('Error: fillForm не поддерживает xpath, используйте обычный селектор', 'error');
    throwError('fillForm не поддерживает xpath');
  }

  const fillResults = await fill(context, formSelector, vals, selectorType);
  if (!fillResults) {
    throwError();
  }

  if (fillResults.errors.length > 0) {
    debug('Error: ошибка при заполнении одного или нескольких полей', 'error');
    debug(fillResults.errors.join('\n'), 'error');
    throwError('ошибка при заполнении полей');
  }

  if (fillResults.files && fillResults.files.length > 0) {
    for (const file of fillResults.files) { // eslint-disable-line no-restricted-syntax
      if (file && file.path) {
        if (!(fse.existsSync(file.path))) {
          debug('Error: нельзя загрузить несуществующий файл', 'error');
          throwError('нельзя загрузить несуществующий файл');
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
