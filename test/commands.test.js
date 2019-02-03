const fs = require('fs');
const resolvePath = require('path').resolve;
const { describe, it } = require('mocha');
const commands = require('../lib/commands');
const RemoteBrowser = require('../');

const declFilePath = resolvePath(__dirname, '../index.d.ts');
const skipMethods = ['sendCmd', 'deleteLocalStorageBaseDir'];

describe('Декларационный файл', () => {
  it('Содержит команды из директории lib/commands и методы RemoteBrowser', () => {
    const declarationFile = fs.readFileSync(declFilePath, { encoding: 'utf-8' });
    const missingCommands = [];
    const classFields = Object.getOwnPropertyNames(RemoteBrowser.prototype);
    const ownMethods = classFields.filter(field => (
      typeof RemoteBrowser.prototype[field] === 'function' && field !== 'constructor'
    ));
    const allMethods = ownMethods.concat(Object.keys(commands));
    allMethods.forEach((method) => {
      if (declarationFile.indexOf(method) === -1) {
        missingCommands.push(method);
      }
    });

    if (missingCommands.length > 0) {
      const errorMessage = missingCommands.length === 1
        ? `Команда ${missingCommands[0]} отсутствует в декларационном файле index.d.ts.`
        : `Команды ${missingCommands.join(', ')} отсутствуют в декларационном файле index.d.ts.`;
      throw new Error(errorMessage);
    }
  });

  it('Не содержит лишних методов', () => {
    const declarationFile = fs.readFileSync(declFilePath, { encoding: 'utf-8' });
    const methodRegex = /\s(\w+)\(.*\):.+;/g;
    const classFields = Object.getOwnPropertyNames(RemoteBrowser.prototype);
    const ownMethods = classFields.filter(field => (
      typeof RemoteBrowser.prototype[field] === 'function' && field !== 'constructor'
    ));
    const allMethods = ownMethods.concat(Object.keys(commands));
    const redundantMethods = [];
    let match = methodRegex.exec(declarationFile);

    while (match) {
      const declaredMethod = match[1];
      if (!skipMethods.includes(declaredMethod) && !allMethods.includes(declaredMethod)) {
        redundantMethods.push(declaredMethod);
      }
      match = methodRegex.exec(declarationFile);
    }

    if (redundantMethods.length > 0) {
      const errorMessage = redundantMethods.length === 1
        ? `Команда ${redundantMethods[0]} объявлена в декларационном файле, но более не используется.`
        : `Команды ${redundantMethods.join(', ')} объявлены в декларационном файле, но более не используются.`;
      throw new Error(errorMessage);
    }
  });
});
