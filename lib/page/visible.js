/* eslint-disable no-undef */
/**
 * @param {!RemoteBrowser=} context
 * @param {ElementHandle} element
 * @param {boolean=} nonZeroBoundingBox
 * @return {Promise<boolean>}
 */
const visible = async function visible(context, element, nonZeroBoundingBox) {
  const style = await context.page.evaluate(e => JSON.parse(JSON.stringify(getComputedStyle(e))) // хак для getComputedStyle из-за особенностей Puppeteer (баг)
    , element);
  const bBox = await element.boundingBox();

  if (style && (style.display === 'none' || style.visibility === 'hidden')) {
    return false;
  }

  if (nonZeroBoundingBox && bBox && (bBox.width === 0 || bBox.height === 0)) {
    return false;
  }

  return !!bBox;
};

module.exports = visible;
