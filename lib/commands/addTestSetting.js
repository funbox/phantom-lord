const checkCmd = require('../utils/checkCommand');

module.exports = function addTestSetting(setting, value) {
  return this.then(() => {
    checkCmd.call(this, { name: 'addTestSetting', params: { setting, value } });

    this.testSettings[setting] = value;
  });
};
