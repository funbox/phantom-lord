const { debug } = require('../utils/index');

const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');
const width = Number(browserArgs.viewportWidth) || 1440;
const height = Number(browserArgs.viewportHeight) || 900;

/**
 * @this RemoteBrowser
 * @return {Promise<Page>}
 */
const openPage = async function openPage() {
  const openedPages = await this.chromium.pages();
  if (this.HEADLESS && openedPages.length > 0) {
    await openedPages[0].close();
  }

  const page = await this.chromium.newPage();
  await page.setViewport({ width, height });

  page.on('error', (error) => {
    debug(`Browser page unexpectedly crashed. Reason: ${error.message}`);
    this.emit('exit', 1, 'SIGKILL');
  });

  page.on('console', (consoleMsg) => {
    debug(`CONSOLE: ${consoleMsg.text()}`);
  });

  page.on('pageerror', (error) => {
    const { message } = error;
    const notCriticalErrors = [
      'ymaps: script not loaded',
      '[WDS] Disconnected!',
    ];

    if (notCriticalErrors.indexOf(message) >= 0) {
      debug(`Некритическая ошибка: ${message}`);
    } else {
      debug(message);
      this.browserErrors.push({ msg: message });
    }
  });

  page.on('framenavigated', async (frame) => {
    debug(`Redirected to ${frame.url()}`);
  });

  return page;
};

module.exports = openPage;
