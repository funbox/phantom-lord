const fse = require('fs-extra');
const { debug, checkCmd } = require('../utils');

module.exports = function fillForm(formSelector, vals, options) {
  const errorWithUsefulStack = new Error();
  return this.then(async () => {
    const throwError = (status) => {
      errorWithUsefulStack.message = `fillForm('${formSelector}', '${vals}', '${options}'): ${status}`;
      throw errorWithUsefulStack;
    };

    checkCmd.call(this, { name: 'click', params: { formSelector, vals, options } });

    const selectorType = (options && options.selectorType) || 'names';

    if (formSelector.type && formSelector.type === 'xpath') {
      debug('Error: fillForm не поддерживает xpath, используйте обычный селектор');
      throwError('fillForm не поддерживает xpath');
    }

    const fillResults = await this.fill(formSelector, vals, selectorType);
    if (!fillResults) {
      throwError();
    }

    if (fillResults.errors.length > 0) {
      debug('Error: ошибка при заполнении одного или нескольких полей');
      debug(fillResults.errors.join('\n'));
      throwError('ошибка при заполнении полей');
    }

    if (fillResults.files && fillResults.files.length > 0) {
      for (const file of fillResults.files) { // eslint-disable-line no-restricted-syntax
        if (file && file.path) {
          if (!(fse.existsSync(file.path))) {
            debug('Error: нельзя загрузить несуществующий файл');
            throwError('нельзя загрузить несуществующий файл');
          }

          let fileFieldSelector;
          if (file.type === 'names') {
            fileFieldSelector = [formSelector, `input[name="${file.selector}"]`].join(' ');
          } else if (file.type === 'css' || file.type === 'labels') {
            fileFieldSelector = [formSelector, file.selector].join(' ');
          }
          const fileInput = await this.pageUtils.findOne(fileFieldSelector);
          await fileInput.uploadFile(file.path);
        }
      }
    }
  });
};
