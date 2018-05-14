module.exports = function waitForText(text, onTimeout) {
  return this.waitFor(async () => {
    const pageText = await this.page.evaluate(() => document.body.textContent);
    if (pageText.indexOf(text) === -1) {
      throw new Error(`waitForText('${text}')`);
    }
  }, onTimeout);
};
