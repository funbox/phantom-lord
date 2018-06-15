/**
 * @param {!RemoteBrowser=} context
 * @param {string} setting
 * @param {*} value
 */
module.exports = async function addTestSetting(context, setting, value) {
  context.testSettings[setting] = value;
};
