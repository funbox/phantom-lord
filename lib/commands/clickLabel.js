const f = require('util').format;
const { quoteXPathAttributeString } = require('../utils');

/**
 * @this RemoteBrowser
 * @param {string} label - текст, который должен содержаться в теге
 * @param {string=} tag - тег в разметке, по которому нужно кликнуть
 */
module.exports = function clickLabel(label, tag) {
  tag = tag || '*';
  const escapedLabel = quoteXPathAttributeString(label);
  const selector = this.xpath(f('//%s[text()=%s]', tag, escapedLabel));
  return this.click(selector);
};
