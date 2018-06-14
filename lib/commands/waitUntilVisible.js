const waitFor = require('./waitFor');
const expectVisibilityState = require('./expectVisibilityState');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}}  selector
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitUntilVisible(context, selector, onTimeout) {
  return waitFor(context, () => expectVisibilityState('invisible', context, selector), onTimeout);
};
