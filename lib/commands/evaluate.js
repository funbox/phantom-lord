const checkCmd = require('../utils/checkCommand');

/**
 * @param {!RemoteBrowser=} context
 * @param {Function} fn - функция, которую нужно выполнить на странице
 * @param {...*} args - аргументы, передаваемые в выполняемую функцию
 */
module.exports = function evaluate(context, fn, ...args) {
  return context.then(async () => {
    checkCmd(context, 'evaluate', fn, args);

    const fnString = fn.toString();
    const argsString = args.reduce((acc, curr) => {
      acc += `'${(curr instanceof RegExp ? curr.toJSON() : curr)}',`;
      return acc;
    }, '');

    const evalString = `(${fnString})(...[${argsString}])`;
    const res = await context.page.evaluate(evalString);
    return res;
  });
};
