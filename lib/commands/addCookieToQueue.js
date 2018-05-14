const checkCmd = require('../utils/checkCommand');

module.exports = function addCookieToQueue(cookie) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'addCookieToQueue', params: { cookie } });

    try {
      if (this.isInitialized) {
        await this.page.evaluate((cookieItem) => {
          document.cookie = [cookieItem.name, cookieItem.value].join('=');
        }, cookie);
      } else {
        this.cookiesQueue.push(cookie);
      }
    } catch (e) {
      throw new Error(`addCookieToQueue(${cookie.name} ${cookie.value})`);
    }
  });
};
