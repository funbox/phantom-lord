const f = require('util').format;
const { quoteXPathAttributeString } = require('../utils');

module.exports = function clickLabel(label, tag) {
  tag = tag || '*';
  const escapedLabel = quoteXPathAttributeString(label);
  const selector = this.xpath(f('//%s[text()=%s]', tag, escapedLabel));
  return this.click(selector);
};
