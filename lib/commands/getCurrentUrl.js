/**
 * @param {!RemoteBrowser=} context
 * @returns {Promise<string>}
 */
module.exports = async function getCurrentUrl(context) {
  const url = await context.page.url();
  return decodeURIComponent(url);
};
