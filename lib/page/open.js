const { debug } = require('../utils/index');

const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');
const width = Number(browserArgs.viewportWidth) || 1440;
const height = Number(browserArgs.viewportHeight) || 900;

/**
 * @param {JSHandle<ConsoleMessage>} handle
 * @returns {Promise<string>}
 */
async function stringifyMessageHandle(handle) {
  const res = await handle.executionContext().evaluate(m => String((m && m.stack) || m), handle);
  return res;
}

/**
 * @param {!RemoteBrowser=} context
 * @returns {Promise<Page>}
 */
const openPage = async function openPage(context) {
  const openedPages = await context.chromium.pages();
  if (context.HEADLESS && openedPages.length > 0) {
    await openedPages[0].close();
  }

  const page = await context.chromium.newPage();
  await page.setViewport({ width, height });

  page.on('error', (error) => {
    debug(`Browser page unexpectedly crashed. Reason: ${error.message}`, 'error');
    context.emit('exit', 1, 'SIGKILL');
  });

  page.on('console', async (message) => {
    context.CDPConnectionsInProgress += 1;
    const args = await Promise.all(message.args().map(stringifyMessageHandle));
    context.CDPConnectionsInProgress -= 1;
    const severityLevel = message.type() === 'error' ? 'error' : 'verbose';
    debug(`CONSOLE: ${args.join(' ')}`, severityLevel);
  });

  page.on('pageerror', (error) => {
    const { message } = error;
    const notCriticalErrors = [
      'ymaps: script not loaded',
      '[WDS] Disconnected!',
    ];

    if (notCriticalErrors.indexOf(message) >= 0) {
      debug(`Некритическая ошибка: ${message}`, 'warn');
    } else {
      debug(message, 'error');
      context.browserErrors.push({ msg: message });
    }
  });

  page.on('framenavigated', async (frame) => {
    debug(`Redirected to ${frame.url()}`, 'info');
  });

  return page;
};

module.exports = openPage;
