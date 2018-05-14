const checkCmd = require('../utils/checkCommand');

module.exports = async function getCount(selector) {
  checkCmd.call(this, { name: 'getCount', params: { selector } });

  const elements = await this.pageUtils.findAll(selector);
  return elements.length;
};
