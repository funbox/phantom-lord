const waitFor = require('./waitFor');
const { replaceNbsp } = require('../utils');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} text
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForText(context, text, onTimeout) {
  return waitFor(context, async () => {
    const pageText = await context.page.evaluate(() => document.body.textContent);
    if (replaceNbsp(pageText).indexOf(replaceNbsp(text)) === -1) {
      throw new Error(`waitForText('${text}')`);
    }
  }, 'waitForText', onTimeout);
};
