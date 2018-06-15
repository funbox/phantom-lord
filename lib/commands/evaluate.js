const RegexpToJson = regexp => `re:${regexp.source}`;

/**
 * @param {!RemoteBrowser=} context
 * @param {Function} fn - функция, которую нужно выполнить на странице
 * @param {...*} args - аргументы, передаваемые в выполняемую функцию
 */
module.exports = async function evaluate(context, fn, ...args) {
  const processedArgs = args.map(a => (a instanceof RegExp ? RegexpToJson(a) : a));
  return context.page.evaluate(fn, ...processedArgs);
};
