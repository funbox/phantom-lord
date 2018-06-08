const checkCmd = require('../utils/checkCommand');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} setting
 * @param {*} value
 */
module.exports = function addTestSetting(context, setting, value) {
  return context.then(() => {
    checkCmd(context, { name: 'addTestSetting', params: { setting, value } });

    context.testSettings[setting] = value;
  });
};
