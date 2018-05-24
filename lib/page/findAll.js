const processSelectorType = require('../utils/processSelectorType');

/**
 * @this RemoteBrowser
 * @param {string|{type: string, path: string}} selector
 * @param {*=} scope
 * @return {Promise<Array.<ElementHandle>>}
 */
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
