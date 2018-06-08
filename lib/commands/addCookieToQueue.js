const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {Object.<string, string>} cookie
 */
module.exports = function addCookieToQueue(context, cookie) {
  return context.then(async () => {
    checkCmd(context, { name: 'addCookieToQueue', params: { cookie } });

    try {
      if (context.isInitialized) {
        await context.page.evaluate((cookieItem) => {
          document.cookie = [cookieItem.name, cookieItem.value].join('=');
        }, cookie);
      } else {
        context.cookiesQueue.push(cookie);
      }
    } catch (e) {
      throw new Error(`addCookieToQueue(${cookie.name} ${cookie.value})`);
    }
  });
};
