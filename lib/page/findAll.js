const processSelectorType = require('../utils/processSelectorType');

const findAll = async function findAll(selector, scope = this.page) {
  const pSelector = processSelectorType(selector);
  let elements;

  if (pSelector.type === 'xpath') {
    elements = await scope.$x(pSelector.path);
  } else {
    elements = await scope.$$(pSelector.path);
  }

  return elements;
};

module.exports = findAll;
