const fs = require('fs');
const resolvePath = require('path').resolve;
const { describe, it } = require('mocha');
const commands = require('../lib/commands');
const RemoteBrowser = require('..');

const declFilePath = resolvePath(__dirname, '../index.d.ts');
const skipMethods = ['sendCmd', 'deleteLocalStorageBaseDir'];

describe('Declaration file', () => {
  it('contains commands from lib/commands and methods of RemoteBrowser', () => {
    const declarationFile = fs.readFileSync(declFilePath, 'utf-8');
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
        ? `The command ${missingCommands[0]} is not found in index.d.ts.`
        : `The commands ${missingCommands.join(', ')} are not found in index.d.ts.`;
      throw new Error(errorMessage);
    }
  });

  it('does not contain excess methods', () => {
    const declarationFile = fs.readFileSync(declFilePath, 'utf-8');
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
        ? `The command ${redundantMethods[0]} is declared in index.d.ts, but not used anymore.`
        : `The commands ${redundantMethods.join(', ')} are declared in index.d.ts, but not used anymore.`;
      throw new Error(errorMessage);
    }
  });
});
