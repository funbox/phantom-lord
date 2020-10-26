const RegexpToJson = regexp => `re:${regexp.source}`;

/**
 * @param {!RemoteBrowser=} context
 * @param {Function} fn - function that will be evaluated on the page
 * @param {...*} args - arguments of the function
 */
module.exports = async function evaluate(context, fn, ...args) {
  const processedArgs = args.map(a => (a instanceof RegExp ? RegexpToJson(a) : a));
  return context.page.evaluate(fn, ...processedArgs);
};
