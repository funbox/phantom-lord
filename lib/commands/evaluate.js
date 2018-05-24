const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {Function} fn - функция, которую нужно выполнить на странице
 * @param {...*} args - аргументы, передаваемые в выполняемую функцию
 */
module.exports = function evaluate(fn, ...args) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'evaluate', params: { fn, args } });

    const fnString = fn.toString();
    const argsString = args.reduce((acc, curr) => {
      acc += `'${(curr instanceof RegExp ? curr.toJSON() : curr)}',`;
      return acc;
    }, '');

    const evalString = `(${fnString})(...[${argsString}])`;
    const res = await this.page.evaluate(evalString);
    return res;
  });
};
