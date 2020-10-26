const f = require('util').format;
const click = require('./click');
const { quoteXPathAttributeString } = require('../utils');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} label - text that should be inside the tag
 * @param {string=} tag - tag that should be clicked
 */
module.exports = function clickLabel(context, label, tag) {
  tag = tag || '*';
  const escapedLabel = quoteXPathAttributeString(label);
  const selector = context.xpath(f('//%s[text()=%s]', tag, escapedLabel));
  return click(context, selector);
};
