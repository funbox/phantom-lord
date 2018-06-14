const waitFor = require('./waitFor');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} text
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitWhileText(context, text, onTimeout) {
  return waitFor(context, async () => {
    const pageText = await context.page.evaluate(() => document.body.textContent);
    if (pageText.indexOf(text) !== -1) {
      throw new Error(`waitWhileText('${text}')`);
    }
  }, 'waitWhileText', onTimeout);
};
