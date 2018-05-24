const checkCmd = require('../utils/checkCommand');

/**
 * @this RemoteBrowser
 * @param {Object.<string, string>} item
 */
module.exports = function addLocalStorageItemToQueue(item) {
  return this.then(async () => {
    checkCmd.call(this, { name: 'addLocalStorageItemToQueue', params: { item } });

    try {
      if (this.isInitialized) {
        await this.page.evaluate((key, value) => {
          localStorage.setItem(key, value);
        }, item.key, item.value);
      } else {
        this.localStorageItemsQueue.push(item);
      }
    } catch (e) {
      throw new Error(`addLocalStorageItemToQueue(${item.key} ${item.value})`);
    }
  });
};
