/**
 * @param {string|RegExp} url
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = function waitForUrl(url, onTimeout) {
  return this.waitFor(async () => {
    const currentUrl = await this.getCurrentUrl();
    if ((url.exec && url.exec(currentUrl)) || currentUrl.indexOf(url) !== -1) {
      return;
    }

    throw new Error(`Expected URL to be ${url}, but it was ${currentUrl}`);
  }, onTimeout);
};
