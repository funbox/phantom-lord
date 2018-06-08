const f = require('util').format;
const click = require('./click');
const { quoteXPathAttributeString } = require('../utils');

/**
 * @this RemoteBrowser
 * @param {string} label - текст, который должен содержаться в теге
 * @param {string=} tag - тег в разметке, по которому нужно кликнуть
 */
module.exports = function clickLabel(context, label, tag) {
  tag = tag || '*';
  const escapedLabel = quoteXPathAttributeString(label);
  const selector = context.xpath(f('//%s[text()=%s]', tag, escapedLabel));
  return click(context, selector);
};
