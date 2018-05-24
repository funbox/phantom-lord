const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @returns {Promise<string>}
 */
module.exports = async function getCurrentUrl() {
  checkCmd.call(this, { name: 'getCurrentUrl' });

  const url = await this.page.url();
  return decodeURIComponent(url);
};
