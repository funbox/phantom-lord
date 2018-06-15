const checkCmd = require('../utils/checkCommand');
const debug = require('../utils/debug');

/**
 * @param {!RemoteBrowser=} context
 * @param {Object.<string, string>} cookie
 */
module.exports = async function addCookieToQueue(context, cookie) {
  //

  try {
    if (context.isInitialized) {
      await context.page.evaluate((cookieItem) => {
        document.cookie = [cookieItem.name, cookieItem.value].join('=');
      }, cookie);
    } else {
      context.cookiesQueue.push(cookie);
    }
  } catch (e) {
    debug('processing cmd "addCookieToQueue" failed', 'error');
    throw new Error(`addCookieToQueue(${cookie.name} ${cookie.value})`);
  }
};
