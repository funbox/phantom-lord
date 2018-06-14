const waitFor = require('./waitFor');
const getCount = require('./getCount');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}} selector
 * @param {number} expectedCount
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForCount(context, selector, expectedCount, onTimeout) {
  return waitFor(context, async () => {
    const foundCount = await getCount(context, selector);
    if (foundCount !== expectedCount) {
      throw new Error(`Expected count of '${selector}' to be '${expectedCount}', but it was '${foundCount}'`);
    }
  }, 'waitForCount', onTimeout);
};
