const waitFor = require('./waitFor');
const getCurrentUrl = require('./getCurrentUrl');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|RegExp} url
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitForUrl(context, url, onTimeout) {
  return waitFor(context, async () => {
    const currentUrl = await getCurrentUrl(context);
    if ((url.exec && url.exec(currentUrl)) || currentUrl.indexOf(url) !== -1) {
      return;
    }

    throw new Error(`Expected URL to be ${url}, but it was ${currentUrl}`);
  }, onTimeout);
};
