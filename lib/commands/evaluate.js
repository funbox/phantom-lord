const checkCmd = require('../utils/checkCommand');

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
