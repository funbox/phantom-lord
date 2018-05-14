module.exports = async function fill(form, vals, findType = 'css') {
  const out = {
    errors: [],
    fields: [],
    files: [],
  };

  try {
    form = await this.pageUtils.findOne(form);
  } catch (e) {
    if (e.name === 'SYNTAX_ERR') {
      out.errors.push(`invalid form selector provided: '${form}'`);
      return out;
    }
  }

  if (!form) {
    out.errors.push('form not found');
    return out;
  }


  for (const fieldSelector in vals) { // eslint-disable-line no-restricted-syntax
    if (vals.hasOwnProperty(fieldSelector)) { // eslint-disable-line no-prototype-builtins
      try {
        out.fields[fieldSelector] = await this.pageUtils.setFieldValue(fieldSelector, vals[fieldSelector], form);
      } catch (err) {
        switch (err.name) {
          case 'FieldNotFound':
            out.errors.push(`Unable to find field element in form: ${err.toString()}`);
            break;
          case 'FileUploadError':
            out.files.push({
              type: findType,
              selector: findType === 'labels' ? `#${err.id}` : fieldSelector,
              path: err.path,
            });
            break;
          default:
            out.errors.push(err.toString());
        }
      }
    }
  }
  return out;
};
