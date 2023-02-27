/**
 * @param {!RemoteBrowser} context
 * @param {string} url
 */

const setPageCookies = async function setPageCookies(context, url) {
  if (!context.cookiesQueue.length) return;

  try {
    const { hostname } = new URL(url);

    await context.page.setCookie(...context.cookiesQueue.map(cookie => ({
      domain: hostname,
      ...cookie,
    })));
  } catch (e) {
    throw new Error(`setCookie error, cookiesQueue: [${context.cookiesQueue.map(cookie => JSON.stringify({ url, ...cookie })).join(',')}]`);
  }
};

module.exports = setPageCookies;
