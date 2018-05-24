const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {string} setting
 * @param {*} value
 */
module.exports = function addTestSetting(setting, value) {
  return this.then(() => {
    checkCmd.call(this, { name: 'addTestSetting', params: { setting, value } });

    this.testSettings[setting] = value;
  });
};
