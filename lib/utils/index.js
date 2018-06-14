const path = require('path');
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

const projectPath = path.resolve(require.resolve('funbox-phantom-lord'), '../../../'); // найти директорию node_modules и подняться на уровень выше

module.exports = {
  debug,
  checkCmd,
  onCloseCb,
  replaceNbsp,
  projectPath,
  quoteXPathAttributeString,
};
