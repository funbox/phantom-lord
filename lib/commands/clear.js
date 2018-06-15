const evaluate = require('./evaluate');

/**
 * @param {!RemoteBrowser=} context
 * @param {!RemoteBrowser=} context
 * @param {string} selectorArg
 */
module.exports = function clear(context, selectorArg) {
  return evaluate(context, function (selector) { // eslint-disable-line func-names, prefer-arrow-callback
    document.querySelector(selector).value = '';
  }, selectorArg);
};
