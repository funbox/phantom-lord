module.exports = async function waitForCount(selector, expectedCount, onTimeout) {
  return this.waitFor(async () => {
    const foundCount = await this.getCount(selector);
    if (foundCount !== expectedCount) {
      throw new Error(`Expected count of '${selector}' to be '${expectedCount}', but it was '${foundCount}'`);
    }
  }, onTimeout);
};
