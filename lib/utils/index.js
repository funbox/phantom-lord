const debug = require('./debug');
const checkCmd = require('./checkCommand');
const onCloseCb = require('./onCloseCb');

const quoteXPathAttributeString = (string) => {
  if (/"/g.test(string)) {
    return `concat("${string.toString().replace(/"/g, '", \'"\', "')}")`;
  }
  return `"${string}"`;
};

module.exports = {
  debug,
  checkCmd,
  onCloseCb,
  quoteXPathAttributeString,
};
