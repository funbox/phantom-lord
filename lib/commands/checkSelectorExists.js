const checkCmd = require('../utils/checkCommand');

module.exports = async function checkSelectorExists(selector, shouldExist = true) {
  checkCmd.call(this, { name: 'checkSelectorExists', params: { selector } });

  const res = await this.pageUtils.findAll(selector);
  if (shouldExist && res.length === 0) {
    throw new Error(`Expected selector '${selector}' do not exist`);
  }

  if (!shouldExist && res.length > 0) {
    throw new Error(`Expected selector '${selector}' exists`);
  }
};
