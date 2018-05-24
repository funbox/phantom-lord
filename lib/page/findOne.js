const processSelectorType = require('../utils/processSelectorType');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {*=} scope
 * @return {Promise<ElementHandle>}
 */
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
