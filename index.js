const spawn = require('child_process').spawn;
const request = require('request');
const EventEmitter = require('events').EventEmitter;
const utils = require('./utils.js');
const path = require('path');
const uuidv4 = require('uuid/v4');
const rimraf = require('rimraf');
const phantomjs = require('phantomjs-prebuilt');

// eslint-disable-next-line no-extend-native
RegExp.prototype.toJSON = function toJSON() { return `re:${this.source}`; }; // для сохранения regexp в моках
const f = utils.format;
const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');
const localStorageBaseDir = path.resolve('node_modules/.funbox-phantom-lord-local-storage');

function debug(str) {
  if (process.env.DEBUG) {
    console.log(`debug: ${str}`);
  }
}

class RemoteBrowser extends EventEmitter {
  constructor() {
    super();
    this.state = 'notStarted';
    this.currentStep = 0;
    this.stepInsertOffset = 1;
    this.steps = [];
  }

  startRemoteBrowser() {
    if (this.state !== 'notStarted') return;
    this.state = 'starting';

    debug('start remote server');
    const localStoragePath = path.resolve(localStorageBaseDir, uuidv4());
    const pathToPhantom = process.platform === 'win32' ? phantomjs.path : './node_modules/phantomjs-prebuilt/bin/phantomjs';
    this.server = spawn(pathToPhantom, [`--local-storage-path=${localStoragePath}`, './node_modules/funbox-phantom-lord/browser-server.js', process.env.BROWSER_ARGS]);
    this.pid = this.server.pid;
    process.stdin.pipe(this.server);
    this.server.stderr.on('data', (data) => {
      if (process.env.DEBUG || process.env.PHANTOM_OUTPUT) {
        process.stdout.write(`phantom ${this.pid}: ${data.toString('utf8')}`);
      }
    });

    this.server.stdout.on('data', (data) => {
      if (process.env.DEBUG || process.env.PHANTOM_OUTPUT) {
        process.stdout.write(`phantom ${this.pid}: ${data.toString('utf8')}`);
      }

      if (data.indexOf('Server started') > -1) {
        this.port = /Server started at (\d+)/.exec(data)[1];
        this.state = 'started';
        this.stepInsertOffset = 1;

        console.log(`phantom ${this.pid} port is ${this.port}, start processing steps`);
        this.processSteps();
      }
    });

    debug(`server pid: ${this.pid}`);

    this.server.on('close', (code, signal) => {
      debug(`server ${this.pid} closed with code: ${code}, signal: ${signal}`);
      this.emit('exit', code, signal);
      this.state = 'notStarted';
      this.server = null;
    });

    this.server.on('exit', (code, signal) => {
      debug(`server ${this.pid} exited with code: ${code}, signal: ${signal}`);
      this.emit('exit', code, signal);
      this.state = 'notStarted';
      this.server = null;
    });

    this.server.on('phantomError', (err) => {
      debug(`server ${this.pid} emitted an error: ${err}`);
      this.state = 'error';
    });

    // TODO: Добавить отлуп каспера по таймауту
  }

  open(url) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'open', params: { url } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`open page error: ${resp.status}`);
        }
      });
    }));
  }

  waitForText(text, onTimeout) {
    return this.waitFor(() => new Promise((resolve, reject) => {
      this.getPlainText().then((pageText) => {
        if (pageText.indexOf(text) > -1) {
          resolve();
        } else {
          reject(`waitForText('${text}')`);
        }
      });
    }), onTimeout);
  }

  waitForSelector(selector, onTimeout) {
    return this.waitFor(() => this.checkSelectorExists(selector), onTimeout);
  }

  waitWhileSelector(selector, onTimeout) {
    return this.waitFor(() => this.checkSelectorNotExists(selector), onTimeout);
  }

  waitWhileText(text, onTimeout) {
    return this.waitFor(() => new Promise((resolve, reject) => {
      this.getPlainText().then((pageText) => {
        if (pageText.indexOf(text) === -1) {
          resolve();
        } else {
          reject(`waitWhileText('${text}')`);
        }
      });
    }), onTimeout);
  }

  waitForUrl(url, onTimeout) {
    return this.waitFor(() => new Promise((resolve, reject) => {
      this.getCurrentUrl().then((currentUrl) => {
        if ((url.exec && url.exec(currentUrl)) || currentUrl.indexOf(url) !== -1) {
          resolve();
        } else {
          reject(`waitForUrl('${url}')`);
        }
      });
    }), onTimeout);
  }

  waitWhileVisible(selector, onTimeout) {
    return this.waitFor(() => this.checkVisibility(selector), onTimeout);
  }

  waitUntilVisible(selector, onTimeout) {
    return this.waitFor(() => this.checkInvisibility(selector), onTimeout);
  }

  waitStart() {
    this.pendingWait = true;
  }

  waitDone() {
    this.pendingWait = false;
  }

  wait(timeout) {
    return this.then(() => new Promise((resolve) => {
      this.waitStart();
      setTimeout((self) => {
        self.waitDone();
        resolve();
      }, timeout, this);
    }));
  }

  waitFor(fn, onTimeout) {
    const errorWithUsefulStack = new Error();
    const startWaitingTime = +new Date();
    if (process.env.E2E_TESTS_WITH_PAUSES) {
      this.CHECK_INTERVAL += 300;
    }
    return this.then(() => new Promise((resolve, reject) => {
      const self = this;
      function condNotSatisfied(error) {
        const currentTime = +new Date();

        if (currentTime - startWaitingTime < self.WAIT_TIMEOUT) {
          setTimeout(() => waiter(), self.CHECK_INTERVAL);
        } else {
          if (onTimeout) onTimeout();
          errorWithUsefulStack.message = error;
          reject({ type: 'timeout', data: errorWithUsefulStack });
        }
      }

      function waiter() {
        // TODO: Добавить try/catch
        const res = fn();
        if (res && res.then) {
          res.then(() => {
            resolve();
          }, (error) => {
            condNotSatisfied(error);
          });
        } else if (res) {
          resolve();
        } else {
          condNotSatisfied();
        }
      }

      waiter();
    }));
  }

  evaluate(fn, ...args) {
    return this.then(() => new Promise((resolve) => {
      this.sendCmd({ name: 'evaluate', params: { fn: fn.toString(), args } }, (resp) => {
        resolve(resp.result);
      });
    }));
  }

  click(selector, x, y) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'click', params: { selector, x, y } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          debug(`click error: ${resp.status}`);
          reject(`click(${selector})`);
        }
      });
    }));
  }

  clickViaOther(selector, otherSelector) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'clickViaOther', params: { selector, otherSelector } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          debug(`clickViaOther error: ${resp.status}`);
          reject(`clickViaOther(${selector}, ${otherSelector})`);
        }
      });
    }));
  }

  sendKeys(selector, keys, options) {
    this.click(selector);
    this._sendKeys(selector, keys, options); // eslint-disable-line no-underscore-dangle
  }

  clickLabel(label, tag) {
    tag = tag || '*';
    const escapedLabel = utils.quoteXPathAttributeString(label);
    const selector = this.xpath(f('//%s[text()=%s]', tag, escapedLabel));
    return this.click(selector);
  }

  _sendKeys(selector, keys, options) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'sendKeys', params: { selector, keys, options } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          debug(`click error: ${resp.status}`);
          reject(`sendKeys(${selector}, ${keys}, ${options})`);
        }
      });
    }));
  }

  exit() {
    if (!this.server) {
      this.state = 'notStarted';
      return Promise.resolve();
    }

    this.state = 'exiting';

    const startWaitingTime = +new Date();
    return new Promise((resolve, reject) => {
      const self = this;
      function notKilled() {
        debug(`server ${self.pid} state: ${self.state}`);

        const currentTime = +new Date();
        if (currentTime - startWaitingTime < self.WAIT_TIMEOUT) {
          setTimeout(() => waiter(), self.CHECK_INTERVAL);
        } else {
          reject();
        }
      }

      function waiter() {
        if (self.state === 'notStarted') {
          resolve();
        } else notKilled();
      }

      this.server.kill();
      waiter();
    });
  }

  then(fn) {
    debug(`currentStep: ${this.currentStep}, stepInsertOffset: ${this.stepInsertOffset}, stepsCount: ${this.steps.length}`);
    this.steps.splice(this.currentStep + this.stepInsertOffset, 0, fn);
    this.stepInsertOffset += 1;
    this.processSteps();
    return this;
  }

  processSteps(lastRes) {
    if (this.state === 'notStarted') {
      this.startRemoteBrowser();
      return;
    }

    if (this.state !== 'started' || this.processing) return;

    if (this.currentStep >= this.steps.length) {
      this.emit('stepsFinished');
      return;
    }

    this.processing = true;

    const step = this.steps[this.currentStep];

    try {
      const stepRes = step(lastRes);
      const processNext = (curRes) => {
        this.currentStep += 1;
        this.stepInsertOffset = 1;
        this.processing = false;
        this.processSteps(curRes);
      };

      if (stepRes && stepRes.then) {
        stepRes.then(processNext, (e) => {
          debug(`processing step ${this.currentStep} of ${this.steps.length} failed`);

          if (e && e.type) {
            if (e.type === 'timeout') {
              this.emit('timeout', e.data);
            } else {
              this.emit('error', e.data);
            }
          } else {
            this.emit('error', e);
          }
        });
      } else {
        processNext(stepRes);
      }
    } catch (e) {
      this.emit('error', e);
    }
  }

  getPlainText() {
    return new Promise((resolve) => {
      this.sendCmd({ name: 'getPlainText' }, (resp) => {
        resolve(resp.result);
      });
    });
  }

  getCurrentUrl() {
    return new Promise((resolve) => {
      this.sendCmd({ name: 'getCurrentUrl' }, (resp) => {
        resolve(resp.result);
      });
    });
  }

  checkSelectorExists(selector) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'checkSelectorExists', params: { selector } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`Expected selector '${selector}' do not exist`);
        }
      });
    });
  }

  checkSelectorNotExists(selector) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'checkSelectorExists', params: { selector } }, (resp) => {
        if (resp.status === 'notFound') {
          resolve();
        } else {
          reject(`Expected selector '${selector}' exists`);
        }
      });
    });
  }

  checkSelectorText(selector, text, exactMatch = false) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'checkSelectorText', params: { selector, text, exactMatch } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`Expected text of '${selector}' to be '${text}', but it was '${resp.text}'`);
        }
      });
    });
  }

  checkSelectorValue(selector, value) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'checkSelectorValue', params: { selector, value } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`Expected value of '${selector}' to be '${value}', but it was '${resp.value}'`);
        }
      });
    });
  }

  checkVisibility(selector) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'checkVisibility', params: { selector } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`Expected selector '${selector}' is not visible`);
        }
      });
    });
  }

  checkInvisibility(selector) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'checkVisibility', params: { selector } }, (resp) => {
        if (resp.status !== 'ok') {
          resolve();
        } else {
          reject(`Error: Expected selector '${selector}' is visible`);
        }
      });
    });
  }

  // TODO: Зарефакторить эту функцию, сделать поведение более простым, сейчас иногда cb вызывается, иногда - нет, что не очень хорошо
  sendCmd(cmd, cb) {
    debug(`processing cmd: ${JSON.stringify(cmd)}`);

    if (this.state !== 'started') {
      console.log(`Can't process cmd because server state = ${this.state}`);
      cb({ status: 'notStarted' });
      return;
    }

    request.post({
      method: 'POST',
      url: `http://localhost:${this.port}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    }, (error, response, body) => {
      // debug(`response received: ${body}`);
      if (error) {
        const errorText = `Error while processing cmd: ${JSON.stringify(cmd)}`;
        debug(errorText);
        this.emit('phantomError', errorText);
      } else {
        let jsonResp;
        try {
          jsonResp = JSON.parse(body);
        } catch (e) {
          console.log(`Error while parsing body: ${body}`);
          this.emit('phantomError', e);
          return;
        }

        if (jsonResp.browserErrors) {
          this.emit('browserErrors', jsonResp.browserErrors);
        }

        cb(jsonResp);
      }
    });
  }

  addCookieToQueue(cookie) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'addCookieToQueue', params: { cookie } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`addCookieToQueue(${cookie.name} ${cookie.value})`);
        }
      });
    }));
  }

  addLocalStorageItemToQueue(item) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'addLocalStorageItemToQueue', params: { item } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`addLocalStorageItemToQueue(${item.key} ${item.value})`);
        }
      });
    }));
  }

  addStubToQueue(stub) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'addStubToQueue', params: { stub } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`addStubToQueue(${stub.method} ${stub.url})`);
        }
      });
    }));
  }

  addTestSetting(setting, value) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'addTestSetting', params: { setting, value } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`addTestSetting(${setting}, ${value})`);
        }
      });
    }));
  }

  getCurrentStubs() {
    // в evaluate нельзя передавать стрелочные функции!
    this.evaluate(function () { // eslint-disable-line func-names, prefer-arrow-callback
      return window.stubs; // eslint-disable-line no-undef
    });
  }

  capture(filename) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'capture', params: { filename } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`capture(${filename})`);
        }
      });
    });
  }

  captureInPath(pathArg) {
    return new Promise((resolve, reject) => {
      this.sendCmd({ name: 'captureInPath', params: { pathArg } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  getCount(selector) {
    return new Promise((resolve) => {
      this.sendCmd({ name: 'getCount', params: { selector } }, (resp) => {
        resolve(resp.result);
      });
    });
  }

  waitForCount(selector, expectedCount, onTimeout) {
    return this.waitFor(() => new Promise((resolve, reject) => {
      this.getCount(selector).then((foundCount) => {
        if (foundCount === expectedCount) {
          resolve();
        } else {
          reject(`Expected count of '${selector}' to be '${expectedCount}', but it was '${foundCount}'`);
        }
      });
    }), onTimeout);
  }

  waitForSelectorText(selector, expectedText, exactMatch, onTimeout) {
    return this.waitFor(() => this.checkSelectorText(selector, expectedText, exactMatch), onTimeout);
  }

  waitForSelectorValue(selector, expectedText, onTimeout) {
    return this.waitFor(() => this.checkSelectorValue(selector, expectedText), onTimeout);
  }

  scrollSelectorToTop(selectorArg) {
    // в evaluate нельзя передавать стрелочные функции!
    return this.evaluate(function (selector) { // eslint-disable-line func-names, prefer-arrow-callback
      const el = window.__utils__.findOne(selector); // eslint-disable-line no-underscore-dangle, no-undef
      el.scrollTop = 0;
    }, selectorArg);
  }

  scrollSelectorToBottom(selectorArg) {
    // в evaluate нельзя передавать стрелочные функции!
    return this.evaluate(function (selector) { // eslint-disable-line func-names, prefer-arrow-callback
      const el = window.__utils__.findOne(selector); // eslint-disable-line no-underscore-dangle, no-undef
      el.scrollTop = el.scrollHeight;
    }, selectorArg);
  }

  xpath(expression) { // eslint-disable-line class-methods-use-this
    return {
      type: 'xpath',
      path: expression,
      toString() {
        return `${this.type} selector: ${this.path}`;
      },
    };
  }

  fillForm(selector, vals, options) {
    return this.then(() => new Promise((resolve, reject) => {
      this.sendCmd({ name: 'fillForm', params: { selector, vals, options } }, (resp) => {
        if (resp.status === 'ok') {
          resolve();
        } else {
          reject(`fillForm('${selector}', '${vals}', '${options}')`);
        }
      });
    }));
  }

  fillSelectors(formSelector, vals, submit) {
    return this.fillForm(formSelector, vals, {
      submit,
      selectorType: 'css',
    });
  }
}


RemoteBrowser.prototype.WAIT_TIMEOUT = browserArgs.waitTimeout || 30000;
RemoteBrowser.prototype.CHECK_INTERVAL = 50;

RemoteBrowser.deleteLocalStorageBaseDir = function deleteLocalStorageBaseDir() {
  rimraf.sync(localStorageBaseDir);
};

module.exports = RemoteBrowser;
