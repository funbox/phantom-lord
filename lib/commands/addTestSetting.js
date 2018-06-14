const checkCmd = require('../utils/checkCommand');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} setting
 * @param {*} value
 */
module.exports = async function addTestSetting(context, setting, value) {
  checkCmd(context, 'addTestSetting', setting, value);
  context.testSettings[setting] = value;
};
