const checkCmd = require('../utils/checkCommand');

/**
 * @param {!RemoteBrowser=} context
 * @param {Object.<string, string>} item
 */
module.exports = function addLocalStorageItemToQueue(context, item) {
  return context.then(async () => {
    checkCmd(context, 'addLocalStorageItemToQueue', item);

    try {
      if (context.isInitialized) {
        await context.page.evaluate((key, value) => {
          localStorage.setItem(key, value);
        }, item.key, item.value);
      } else {
        context.localStorageItemsQueue.push(item);
      }
    } catch (e) {
      throw new Error(`addLocalStorageItemToQueue(${item.key} ${item.value})`);
    }
  });
};
