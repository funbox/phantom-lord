const detectSelectorType = require('../utils/detectSelectorType');

/**
 * @param {!RemoteBrowser.page|ElementHandle} scope
 * @param {string|{type: string, path: string}} selector
 * @return {Promise<ElementHandle>}
 */
const findOne = async function findOne(scope, selector) {
  const pSelector = detectSelectorType(selector);
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
