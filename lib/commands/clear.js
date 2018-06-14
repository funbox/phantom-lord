const evaluate = require('./evaluate');
const checkCmd = require('../utils/checkCommand');

/**
 * @param {!RemoteBrowser=} context
 * @param {!RemoteBrowser=} context
 * @param {string} selectorArg
 */
module.exports = function clear(context, selectorArg) {
  checkCmd(context, 'clear', selectorArg);

  return evaluate(context, function (selector) { // eslint-disable-line func-names, prefer-arrow-callback
    document.querySelector(selector).value = '';
  }, selectorArg);
};
