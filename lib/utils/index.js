const appRoot = require('app-root-path');
const debug = require('./debug');
const checkCmd = require('./checkCommand');
const onCloseCb = require('./onCloseCb');

const quoteXPathAttributeString = (string) => {
  if (/"/g.test(string)) {
    return `concat("${string.toString().replace(/"/g, '", \'"\', "')}")`;
  }
  return `"${string}"`;
};

const replaceNbsp = text => text.replace(/\u00a0/g, ' ');

const matchUrl = (url, template) => (template.test && template.test(url)) || url.indexOf(template) !== -1;

const projectPath = appRoot.path;

module.exports = {
  debug,
  checkCmd,
  matchUrl,
  onCloseCb,
  replaceNbsp,
  projectPath,
  quoteXPathAttributeString,
};
