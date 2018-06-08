const checkCmd = require('../utils/checkCommand');

/**
 * @param {!RemoteBrowser=} context
 * @returns {Promise<string>}
 */
module.exports = async function getCurrentUrl(context) {
  checkCmd(context, { name: 'getCurrentUrl' });

  const url = await context.page.url();
  return decodeURIComponent(url);
};
