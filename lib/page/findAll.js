const processSelectorType = require('../utils/processSelectorType');

/**
 * @param {!RemoteBrowser.page|ElementHandle} scope
 * @param {string|{type: string, path: string}} selector
 * @return {Promise<Array.<ElementHandle>>}
 */
const findAll = async function findAll(scope, selector) {
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
