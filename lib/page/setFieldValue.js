module.exports = async function setFieldValue(fieldSelector, fieldValue, scope) {
  const field = await this.pageUtils.findOne(fieldSelector, scope);
  const fieldFileErrorObject = {
    name: 'FileUploadError',
    message: 'File field must be filled using this.page.uploadFile',
    path: fieldValue,
    id: field.id || null,
  };

  if (!field) {
    const error = new Error(`setField: Invalid field ${fieldSelector}`);
    error.name = 'FieldNotFound';
    throw error;
  }

  const fieldType = await (await field.getProperty('type')).jsonValue();

  switch (fieldType) {
    case 'checkbox':
    case 'radio':
      await this.page.evaluate((e, val) => {
        e.checked = !!val;
      }, field, fieldValue);
      break;
    case 'file':
      throw fieldFileErrorObject;
    case 'select':
      await this.page.select(fieldSelector, fieldValue);
      break;
    case 'text':
    case 'password':
    case 'number':
    case 'search':
    case 'tel':
      await this.page.evaluate((e) => { e.value = ''; }, field);
      await field.type(fieldValue.toString());
      break;
    default:
      await this.page.evaluate((e, val) => {
        e.value = val;
      }, field, fieldValue);
  }

  await this.page.evaluate((fieldArg) => {
    ['change', 'input'].forEach((name) => {
      const event = document.createEvent('HTMLEvents');
      event.initEvent(name, true, true);
      fieldArg.dispatchEvent(event);
    });
  }, field);

  return true;
};
