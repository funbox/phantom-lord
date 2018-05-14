const processSelectorType = require('../utils/processSelectorType');

const findOne = async function findOne(selector, scope = this.page) {
  const pSelector = processSelectorType(selector);
  let element;

  if (pSelector.type === 'xpath') {
    const res = await scope.$x(pSelector.path);
    element = res.length > 0 ? res[0] : null;
  } else {
    element = await scope.$(pSelector.path);
  }

  return element;
};

module.exports = findOne;
