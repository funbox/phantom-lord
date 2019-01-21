const waitFor = require('./waitFor');
const getCurrentUrl = require('./getCurrentUrl');
const { matchUrl } = require('../utils');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|RegExp} url
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForUrl(context, url, onTimeout) {
  return waitFor(context, async () => {
    const currentUrl = await getCurrentUrl(context);
    if (matchUrl(currentUrl, url)) {
      return;
    }

    throw new Error(`Expected URL to be ${url}, but it was ${currentUrl}`);
  }, 'waitForUrl', onTimeout);
};
