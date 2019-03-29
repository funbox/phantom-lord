const detectSelectorType = require('../utils/detectSelectorType');
const waitFor = require('./waitFor');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|{type: string, path: string}}  selector
 * @param {string} eventType - тип события, например, 'click'
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForEventListener(context, selector, eventType, onTimeout) {
  return waitFor(context, async () => {
    const pSelector = detectSelectorType(selector);

    let expression;
    if (pSelector.type === 'xpath') {
      expression = `$x('${pSelector.path}')[0]`;
    } else {
      expression = `document.querySelector('${pSelector.path}')`;
    }

    const client = await browser.page.target().createCDPSession();

    const { result: { objectId } } = await client.send('Runtime.evaluate', { expression, includeCommandLineAPI: true });

    const { listeners } = await client.send('DOMDebugger.getEventListeners', { objectId });

    await client.detach();

    if (!listeners || !listeners.find(listener => listener.type === eventType)) {
      throw new Error(`Expected element "${selector}" to have event listener for "${eventType}"`);
    }
  }, 'waitForEventListener', onTimeout);
};
