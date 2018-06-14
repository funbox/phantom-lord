const checkCmd = require('../utils/checkCommand');
const debug = require('../utils/debug');

/**
 * @param {!RemoteBrowser=} context
 * @param {Object.<string, string>} item
 */
module.exports = async function addLocalStorageItemToQueue(context, item) {
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
    debug('processing cmd "addLocalStorageItemToQueue" failed', 'error');
    throw new Error(`addLocalStorageItemToQueue(${item.key} ${item.value})`);
  }
};
