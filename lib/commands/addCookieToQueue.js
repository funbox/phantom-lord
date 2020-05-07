const debug = require('../utils/debug');

/**
 * @param {!RemoteBrowser=} context
 * @param {Object.<string, string>} cookie
 */
module.exports = async function addCookieToQueue(context, cookie) {
  try {
    context.cookiesQueue.push(cookie);
    if (context.isInitialized) {
      await context.page.evaluate((cookieItem) => {
        document.cookie = [cookieItem.name, cookieItem.value].join('=');
      }, cookie);
    }
  } catch (e) {
    debug('processing cmd "addCookieToQueue" failed', 'error');
    throw new Error(`addCookieToQueue(${cookie.name} ${cookie.value})`);
  }
};
