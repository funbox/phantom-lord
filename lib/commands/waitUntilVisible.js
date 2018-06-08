const waitFor = require('./waitFor');
const checkVisibility = require('./checkVisibility');

/**
 * @param {string|{type: string, path: string}}  selector
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitUntilVisible(context, selector, onTimeout) {
  return waitFor(context, () => checkVisibility(context, selector, false), onTimeout);
};
