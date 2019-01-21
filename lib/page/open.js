const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');
const width = Number(browserArgs.viewportWidth) || 1440;
const height = Number(browserArgs.viewportHeight) || 900;

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

  return page;
};

module.exports = openPage;
