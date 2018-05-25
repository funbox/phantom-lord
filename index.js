/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, no-undef, prefer-arrow-callback, prefer-template, prefer-spread, func-names, no-await-in-loop, no-prototype-builtins */
const EventEmitter = require('events').EventEmitter;
const puppeteer = require('puppeteer');
const fse = require('fs-extra');
const path = require('path');
const utils = require('./utils.js');

// eslint-disable-next-line no-extend-native
RegExp.prototype.toJSON = function toJSON() { return `re:${this.source}`; }; // для сохранения regexp в моках
const f = utils.format;

const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');
const width = Number(browserArgs.viewportWidth) || 1440;
const height = Number(browserArgs.viewportHeight) || 900;
const projectPath = path.resolve(require.resolve('funbox-phantom-lord'), '../../../'); // найти директорию node_modules и подняться на уровень выше
const supportedSelectorType = ['css', 'xpath'];
const allowedBeforeInitialization = ['addStubToQueue', 'addCookieToQueue', 'addLocalStorageItemToQueue', 'addTestSetting', 'open'];
const STATUS = {
  OK: 'ok',
  NOT_FOUND: 'notFound',
  INVISIBLE: 'invisibleElement',
};

const headlessMode = !(process.env.HEADLESS_OFF || browserArgs.headlessOff);

class RemoteBrowser extends EventEmitter {
  constructor() {
    super();
    this.state = 'notStarted';
    this.chromium = null;
    this.page = null;
    this.currentStep = 0;
    this.cmdId = 0;
    this.stepInsertOffset = 1;
    this.steps = [];
    this.stubsQueue = [];
    this.cookiesQueue = [];
    this.localStorageItemsQueue = [];
    this.testSettings = {};
    this.browserErrors = [];
    this.isInitialized = false;
  }

  async startRemoteBrowser() {
    if (this.state !== 'notStarted') return;
    this.state = 'starting';

    try {
      this.chromium = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: headlessMode,
        slowMo: this.SLOW_MO,
      });
      this.setBrowserEventHandlers();
      this.pid = this.chromium.process().pid;
      debug(`Puppeteer ${this.pid}: Remote browser has been started. Current version: ${await this.chromium.version()}`);

      this.state = 'started';
      this.stepInsertOffset = 1;

      console.log(`Puppeteer ${this.pid}: start processing steps`);
      this.processSteps();
    } catch (error) {
      debug(`debug: ${error.toString()}`);
      this.emit('phantomError', error.message);
    }
  }

  async openNewPage() {
    const openedPages = await this.chromium.pages();
    if (headlessMode && openedPages.length > 0) {
      await openedPages[0].close();
    }

    this.page = await this.chromium.newPage();
    this.setPageEventHandlers();
    await this.page.setViewport({ width, height });

    await this.page.exposeFunction('setPageInitialized', () => {
      if (!this.isInitialized) {
        this.isInitialized = true;
        debug(`Puppeteer ${this.pid}: page initialized`);
      }
    });

    await this.page.evaluateOnNewDocument((settings, cookies, stubs, lsItems) => {
      window.test = settings;
      if (cookies.length > 0) {
        cookies.forEach((cookie) => {
          document.cookie = [cookie.name, cookie.value].join('=');
        });
      }
      if (stubs.length > 0) {
        window.stubs = [];
        stubs.forEach((stub) => {
          window.stubs.push({ method: stub.method, url: stub.url, data: stub.data });
        });
      }

      if (lsItems.length > 0) {
        lsItems.forEach((item) => {
          localStorage.setItem(item.key, item.value);
        });
      }

      window.setPageInitialized();
    }, this.testSettings, this.cookiesQueue, this.stubsQueue, this.localStorageItemsQueue);
  }

  setBrowserEventHandlers() {
    this.chromium.process().on('close', (code, signal) => {
      debug(`Puppeteer ${this.pid} closed with code: ${code}, signal: ${signal}`);
      this.emit('exit', code, signal);
      this.state = 'notStarted';
      this.isInitialized = false;
      this.chromium = null;
    });

    this.chromium.process().on('exit', (code, signal) => {
      debug(`Puppeteer ${this.pid} exited with code: ${code}, signal: ${signal}`);
      this.emit('exit', code, signal);
      this.state = 'notStarted';
      this.isInitialized = false;
      this.chromium = null;
    });
  }

  setPageEventHandlers() {
    this.page.on('error', (error) => {
      debug(`Browser page unexpectedly crashed. Reason: ${error.message}`);
      this.emit('exit', 1, 'SIGKILL');
    });

    this.page.on('console', (consoleMsg) => {
      debug(`CONSOLE: ${consoleMsg.text()}`);
    });

    this.page.on('pageerror', (error) => {
      const { message } = error;
      const notCriticalErrors = [
        'ymaps: script not loaded',
        '[WDS] Disconnected!',
      ];

      if (notCriticalErrors.indexOf(message) >= 0) {
        debug(`Некритическая ошибка: ${message}`);
      } else {
        debug(message);
        this.browserErrors.push({ msg: message });
      }
    });

    this.page.on('framenavigated', async (frame) => {
      debug(`Redirected to ${frame.url()}`);
    });
  }

  open(url) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'open', params: { url } });
      if (resp.status !== STATUS.OK) {
        throw new Error(`open page error: ${resp.status}`);
      }
    });
  }

  waitForText(text, onTimeout) {
    return this.waitFor(async () => {
      const pageText = await this.getPlainText();
      if (pageText.indexOf(text) === -1) {
        throw new Error(`waitForText('${text}')`);
      }
    }, onTimeout);
  }

  waitForSelector(selector, onTimeout) {
    return this.waitFor(() => this.checkSelectorExists(selector), onTimeout);
  }

  waitWhileSelector(selector, onTimeout) {
    return this.waitFor(() => this.checkSelectorNotExists(selector), onTimeout);
  }

  waitWhileText(text, onTimeout) {
    return this.waitFor(async () => {
      const pageText = await this.getPlainText();
      if (pageText.indexOf(text) !== -1) {
        throw new Error(`waitWhileText('${text}')`);
      }
    }, onTimeout);
  }

  waitForUrl(url, onTimeout) {
    return this.waitFor(async () => {
      const currentUrl = await this.getCurrentUrl();
      if ((url.exec && url.exec(currentUrl)) || currentUrl.indexOf(url) !== -1) {
        return;
      }

      throw new Error(`Expected URL to be ${url}, but it was ${currentUrl}`);
    }, onTimeout);
  }

  waitWhileVisible(selector, onTimeout) {
    return this.waitFor(() => this.checkVisibility(selector), onTimeout);
  }

  waitUntilVisible(selector, onTimeout) {
    return this.waitFor(() => this.checkInvisibility(selector), onTimeout);
  }

  wait(timeout) {
    return this.then(() => new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    }));
  }

  waitFor(fn, onTimeout) {
    const errorWithUsefulStack = new Error();
    const startWaitingTime = +new Date();
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
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'evaluate', params: { fn: fn.toString(), args } });
      return resp.result;
    });
  }

  click(selector, elementX, elementY) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'click', params: { selector, elementX, elementY } });

      if (resp.status !== STATUS.OK) {
        debug(`click error: ${resp.status}`);
        throw new Error(`click(${selector} error: ${resp.status})`);
      }
    });
  }

  clickViaOther(selector, otherSelector) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'clickViaOther', params: { selector, otherSelector } });
      if (resp.status !== STATUS.OK) {
        debug(`debug: clickViaOther error: ${resp.status}`);
        throw new Error(`clickViaOther(${selector}, ${otherSelector})`);
      }
    });
  }

  hover(selector, elementX, elementY) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'hover', params: { selector, elementX, elementY } });

      if (resp.status !== STATUS.OK) {
        debug(`hover error: ${resp.status}`);
        throw new Error(`hover(${selector} error: ${resp.status})`);
      }
    });
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

  clickSelectorText(selector, text) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'clickSelectorText', params: { selector, text } });

      if (resp.status !== STATUS.OK) {
        debug(`clickSelectorText error: ${resp.status}`);
        throw new Error(`clickSelectorText(${selector}, '${text}' error: ${resp.status})`);
      }
    });
  }

  _sendKeys(selector, keys, options) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'sendKeys', params: { selector, keys, options } });
      if (resp.status !== STATUS.OK) {
        debug(`sendKeys error: ${response.status}`);
        throw new Error(`sendKeys(${selector}, ${keys}, ${options})`);
      }
    });
  }

  async exit() {
    if (!this.chromium || !this.chromium.process()) {
      this.state = 'notStarted';
      return null;
    }

    this.state = 'exiting';

    const startWaitingTime = +new Date();
    return new Promise(async (resolve, reject) => {
      const self = this;
      const notKilled = () => {
        debug(`debug: browser state: ${this.state}`);

        const currentTime = +new Date();
        if (currentTime - startWaitingTime < this.WAIT_TIMEOUT) {
          setTimeout(() => waiter(), this.CHECK_INTERVAL);
        } else {
          reject();
        }
      };

      function waiter() {
        if (self.state === 'notStarted') {
          resolve();
        } else notKilled();
      }

      await this.chromium.close();
      waiter();
    });
  }

  then(fn) {
    debug(`debug: currentStep: ${this.currentStep}, stepInsertOffset: ${this.stepInsertOffset}, stepsCount: ${this.steps.length}`);
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

  async getPlainText() {
    const resp = await this.processCmd({ name: 'getPlainText' });
    return resp.result;
  }

  async getCurrentUrl() {
    const resp = await this.processCmd({ name: 'getCurrentUrl' });
    return resp.result;
  }

  async checkSelectorExists(selector) {
    const resp = await this.processCmd({ name: 'checkSelectorExists', params: { selector } });
    if (resp.status !== STATUS.OK) {
      throw new Error(`Expected selector '${selector}' do not exist`);
    }
  }

  async checkSelectorNotExists(selector) {
    const resp = await this.processCmd({ name: 'checkSelectorExists', params: { selector } });
    if (resp.status !== STATUS.NOT_FOUND) {
      throw new Error(`Expected selector '${selector}' exists`);
    }
  }

  async checkSelectorText(selector, text, exactMatch = false) {
    const resp = await this.processCmd({ name: 'checkSelectorText', params: { selector, text, exactMatch } });
    if (resp.status !== STATUS.OK) {
      throw new Error(`Expected text of '${selector}' to be '${text}', but it was '${resp.text}'`);
    }
  }

  async checkSelectorValue(selector, value) {
    const resp = await this.processCmd({ name: 'checkSelectorValue', params: { selector, value } });
    if (resp.status !== STATUS.OK) {
      throw new Error(`Expected value of '${selector}' to be '${value}', but it was '${resp.value}'`);
    }
  }

  async checkVisibility(selector) {
    const resp = await this.processCmd({ name: 'checkVisibility', params: { selector } });
    if (resp.status !== STATUS.OK) {
      throw new Error(`Expected selector '${selector}' is not visible`);
    }
  }

  async checkInvisibility(selector) {
    const resp = await this.processCmd({ name: 'checkVisibility', params: { selector } });
    if (resp.status === STATUS.OK) {
      throw new Error(`Expected selector '${selector}' is visible`);
    }
  }

  addCookieToQueue(cookie) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'addCookieToQueue', params: { cookie } });
      if (resp.status !== STATUS.OK) {
        throw new Error(`addCookieToQueue(${cookie.name} ${cookie.value})`);
      }
    });
  }

  addLocalStorageItemToQueue(item) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'addLocalStorageItemToQueue', params: { item } });
      if (resp.status !== STATUS.OK) {
        throw new Error(`addLocalStorageItemToQueue(${item.key} ${item.value})`);
      }
    });
  }

  addStubToQueue(stub) {
    return this.then(async () => {
      if (stub.url instanceof RegExp) {
        stub.url = stub.url.toJSON();
      }
      const resp = await this.processCmd({ name: 'addStubToQueue', params: { stub } });
      if (resp.status !== STATUS.OK) {
        throw new Error(`addStubToQueue(${stub.method} ${stub.url})`);
      }
    });
  }

  addTestSetting(setting, value) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'addTestSetting', params: { setting, value } });
      if (resp.status !== STATUS.OK) {
        throw new Error(`addTestSetting(${setting}, ${stub.value})`);
      }
    });
  }

  getCurrentStubs() {
    this.evaluate(function () {
      return window.stubs;
    });
  }

  async capture(filename) {
    const resp = await this.processCmd({ name: 'capture', params: { filename } });
    if (resp.status !== STATUS.OK) {
      throw new Error(`capture(${filename})`);
    }
  }

  async captureInPath(pathArg) {
    const resp = await this.processCmd({ name: 'captureInPath', params: { path: pathArg } });
    if (resp.status !== STATUS.OK) {
      throw new Error(`captureInPath(${pathArg})`);
    }
  }

  async getCount(selector) {
    const resp = await this.processCmd({ name: 'getCount', params: { selector } });
    return resp.result;
  }

  waitForCount(selector, expectedCount, onTimeout) {
    return this.waitFor(async () => {
      const foundCount = await this.getCount(selector);
      if (foundCount !== expectedCount) {
        throw new Error(`Expected count of '${selector}' to be '${expectedCount}', but it was '${foundCount}'`);
      }
    }, onTimeout);
  }

  waitForSelectorText(selector, expectedText, exactMatch, onTimeout) {
    return this.waitFor(() => this.checkSelectorText(selector, expectedText, exactMatch), onTimeout);
  }

  waitForSelectorValue(selector, expectedText, onTimeout) {
    return this.waitFor(() => this.checkSelectorValue(selector, expectedText), onTimeout);
  }

  scrollSelectorToTop(selector) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'scrollSelectorToTop', params: { selector } });
      if (resp.status !== STATUS.OK) {
        throw new Error('scrollToTop error');
      }
    });
  }

  scrollSelectorToBottom(selector) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'scrollSelectorToBottom', params: { selector } });
      if (resp.status !== STATUS.OK) {
        throw new Error('scrollToBottom error');
      }
    });
  }

  xpath(expression) { // eslint-disable-line class-methods-use-this
    return {
      type: 'xpath',
      path: expression,
      toString() {
        return this.type + ' selector: ' + this.path;
      },
    };
  }

  fillForm(selector, vals, options) {
    return this.then(async () => {
      const resp = await this.processCmd({ name: 'fillForm', params: { selector, vals, options } });
      if (resp.status !== STATUS.OK) {
        throw new Error(`fillForm('${selector}', '${vals}', '${options}')`);
      }
    });
  }

  fillSelectors(formSelector, vals, submit) {
    return this.fillForm(formSelector, vals, {
      submit,
      selectorType: 'css',
    });
  }

  clear(selectorArg) {
    this.evaluate(function (selector) { // eslint-disable-line func-names, prefer-arrow-callback
      document.querySelector(selector).value = ''; // eslint-disable-line no-undef
    }, selectorArg);
  }

  async processCmd(cmd) {
    const commands = {
      async open() {
        try {
          if (!this.isInitialized) {
            await this.openNewPage();
          }
          await this.page.goto(cmd.params.url);
          return ({ status: STATUS.OK });
        } catch (e) {
          return ({ status: 'error', error: e.message });
        }
      },

      async getPlainText() {
        const plainText = await this.page.evaluate(() => document.body.textContent);
        return ({ status: STATUS.OK, result: plainText });
      },

      async getCurrentUrl() {
        const url = await this.page.url();
        return ({ status: STATUS.OK, result: utils.decodeUrl(url) });
      },

      async getCount() {
        const selector = cmd.params.selector;
        const elements = await this.findAll(selector);
        return ({ status: STATUS.OK, result: elements.length });
      },

      async checkSelectorExists() {
        const res = await this.findAll(cmd.params.selector);
        return ({ status: res.length > 0 ? STATUS.OK : STATUS.NOT_FOUND });
      },

      async checkSelectorText() {
        const text = cmd.params.text;
        const exactMatch = cmd.params.exactMatch;
        const elementText = await this.fetchText(cmd.params.selector);

        if ((exactMatch && elementText === text) || (!exactMatch && elementText.indexOf(text) >= 0)) {
          return ({ status: STATUS.OK });
        }
        return ({ status: STATUS.NOT_FOUND, text: elementText });
      },

      async clickSelectorText() {
        const { selector, text } = cmd.params;
        let res = '';
        let visibleElement;
        let matchedByTextElement;
        const els = await this.findAll(selector);

        if (els.length === 0) {
          return ({ status: STATUS.NOT_FOUND });
        }

        for (const el of els) { // eslint-disable-line no-restricted-syntax
          const elementText = await this.fetchTextFromElement(el);

          if (elementText === text) {
            matchedByTextElement = el;

            if (await this.visible(el)) {
              visibleElement = el;
              break;
            }
          }
        }

        if (!matchedByTextElement) {
          return ({ status: STATUS.NOT_FOUND });
        }

        if (!visibleElement) {
          return ({ status: STATUS.INVISIBLE });
        }

        try {
          await visibleElement.click();
          res = STATUS.OK;
        } catch (e) {
          debug(e);
          res = 'clickError';
        }
        return ({ status: res });
      },

      async checkSelectorValue() {
        const el = await this.findOne(cmd.params.selector);
        const value = cmd.params.value;
        const res = el ?
          (await this.page.evaluate(e => e.value, el)) : undefined;
        if (res === value) {
          return ({ status: STATUS.OK });
        }
        return ({ status: 'notEqual', value: res });
      },

      async checkVisibility() {
        const el = await this.findOne(cmd.params.selector);
        if (!el) {
          return ({ status: STATUS.NOT_FOUND });
        }
        const isVisible = await this.visible(el, true);
        return ({ status: isVisible ? STATUS.OK : STATUS.INVISIBLE });
      },

      async evaluate() {
        const { fn, args } = cmd.params;
        const argsString = args.reduce((acc, curr) => {
          acc += `'${(curr instanceof RegExp ? curr.toJSON() : curr)}',`;
          return acc;
        }, '');
        const evalString = `(${fn})(...[${argsString}])`;
        const res = await this.page.evaluate(evalString);
        return ({ status: STATUS.OK, result: res });
      },

      async hover() {
        const { selector, elementX, elementY } = cmd.params;
        let res = '';
        const el = await this.findOne(selector);

        if (!el) {
          return ({ status: STATUS.NOT_FOUND });
        }

        if (!(await this.visible(el))) {
          return ({ status: STATUS.INVISIBLE });
        }

        try {
          if (elementX && elementY) {
            const { x: elementOffsetLeft, y: elementOffsetTop } = await el.boundingBox();
            await this.page.mouse.move(elementOffsetLeft + elementX, elementOffsetTop + elementY);
          } else {
            await el.hover();
          }
          res = STATUS.OK;
        } catch (e) {
          debug(e);
          res = 'hoverError';
        }

        return ({ status: res });
      },

      async click() {
        const { selector, elementX, elementY } = cmd.params;
        let res = '';
        const visibleElements = [];
        const els = await this.findAll(selector);

        if (els.length === 0) {
          return ({ status: STATUS.NOT_FOUND });
        }

        for (const el of els) { // eslint-disable-line no-restricted-syntax
          if (await this.visible(el)) {
            visibleElements.push(el);
          }
        }

        if (visibleElements.length === 0) {
          return ({ status: STATUS.INVISIBLE });
        }

        try {
          if (elementX && elementY) {
            const { x: elementOffsetLeft, y: elementOffsetTop } = await visibleElements[0].boundingBox();
            await this.page.mouse.click(elementOffsetLeft + elementX, elementOffsetTop + elementY);
          } else {
            await visibleElements[0].click();
          }
          res = STATUS.OK;
        } catch (e) {
          debug(e);
          res = 'clickError';
        }
        return ({ status: res });
      },

      async clickViaOther() {
        const { selector, otherSelector } = cmd.params;
        let res = '';
        const el = await this.findOne(selector);
        const otherEl = await this.findOne(otherSelector);

        if (!el) {
          return ({ status: STATUS.NOT_FOUND });
        }

        if (!otherEl) {
          return ({ status: 'notFoundOther' });
        }

        if (!(await this.visible(el))) {
          return ({ status: STATUS.INVISIBLE });
        }

        if (!(await this.visible(otherEl))) {
          return ({ status: 'invisibleElementOther' });
        }

        try {
          await el.click();
          res = STATUS.OK;
        } catch (e) {
          debug(e);
          res = 'clickError';
        }
        return ({ status: res });
      },

      async sendKeys() {
        const { selector, keys } = cmd.params;
        const elem = await this.findOne(selector);
        if (!elem) {
          return ({ status: STATUS.NOT_FOUND });
        }
        await elem.type(keys);
        return ({ status: STATUS.OK });
      },

      async capture() {
        const filename = cmd.params.filename;
        const filepath = filename.split('/');
        const dir = filepath.slice(0, filepath.length - 1).join('/');
        const fullDir = path.join(projectPath, dir);
        await fse.ensureDir(fullDir);

        try {
          const buffer = await this.page.screenshot({
            fullPage: true,
          });
          fse.writeFileSync(path.join(projectPath, filename), buffer);
        } catch (e) {
          debug(e.message);
        }
        return ({ status: STATUS.OK });
      },

      async captureInPath() {
        let p = cmd.params.path;
        p = p.split('/');
        const dir = p.slice(0, p.length - 1).join('/');
        await fse.ensureDir(path.join(projectPath, dir));
        const fname = p.join('/');
        try {
          const buffer = await this.page.screenshot({
            fullPage: true,
          });
          fse.writeFileSync(path.join(projectPath, fname), buffer);
        } catch (e) {
          debug(e.message);
        }
        return ({ status: STATUS.OK });
      },

      async addStubToQueue() {
        const stub = cmd.params.stub;
        if (this.isInitialized) {
          await this.page.evaluate((method, url, data) => {
            window.stubs = window.stubs || [];
            window.stubs.push({ method, url, data });
          }, stub.method, stub.url, stub.data);
        } else {
          this.stubsQueue.push(stub);
        }

        return { status: STATUS.OK };
      },

      async addCookieToQueue() {
        const cookie = cmd.params.cookie;
        if (this.isInitialized) {
          await this.page.evaluate((cookieItem) => {
            document.cookie = [cookieItem.name, cookieItem.value].join('=');
          }, cookie);
        } else {
          this.cookiesQueue.push(cookie);
        }
        return { status: STATUS.OK };
      },

      async addLocalStorageItemToQueue() {
        const item = cmd.params.item;
        if (this.isInitialized) {
          await this.page.evaluate((key, value) => {
            localStorage.setItem(key, value);
          }, item.key, item.value);
        } else {
          this.localStorageItemsQueue.push(item);
        }
        return ({ status: STATUS.OK });
      },

      async addTestSetting() {
        const key = cmd.params.setting;
        const value = cmd.params.value;
        this.testSettings[key] = value;
        return ({ status: STATUS.OK });
      },

      async fillForm() {
        const { selector: formSelector, vals, options } = cmd.params;
        const selectorType = (options && options.selectorType) || 'names';

        if (formSelector.type && formSelector.type === 'xpath') {
          debug('Error: fillForm не поддерживает xpath, используйте обычный селектор');
          return ({ status: 'error' });
        }

        const fillResults = await this.fill(formSelector, vals, selectorType);
        if (!fillResults) {
          return ({ status: 'error' });
        }

        if (fillResults.errors.length > 0) {
          debug('Error: ошибка при заполнении одного или нескольких полей');
          debug(fillResults.errors.join('\n'));
          return ({ status: 'error' });
        }

        if (fillResults.files && fillResults.files.length > 0) {
          for (const file of fillResults.files) { // eslint-disable-line no-restricted-syntax
            if (file && file.path) {
              if (!(fse.existsSync(file.path))) {
                debug('Error: нельзя загрузить несуществующий файл');
                return ({ status: 'error' });
              }

              let fileFieldSelector;
              if (file.type === 'names') {
                fileFieldSelector = [formSelector, 'input[name="' + file.selector + '"]'].join(' ');
              } else if (file.type === 'css' || file.type === 'labels') {
                fileFieldSelector = [formSelector, file.selector].join(' ');
              }
              const fileInput = await this.findOne(fileFieldSelector);
              await fileInput.uploadFile(file.path);
            }
          }
        }
        return ({ status: STATUS.OK });
      },

      async scrollSelectorToTop() {
        const { selector } = cmd.params;
        const element = await this.findOne(selector);
        await this.page.evaluate((e) => {
          e.scrollTop = 0;
        }, element);

        return ({ status: STATUS.OK });
      },

      async scrollSelectorToBottom() {
        const { selector } = cmd.params;
        const element = await this.findOne(selector);
        await this.page.evaluate((e) => {
          e.scrollTop = e.scrollHeight;
        }, element);

        return ({ status: STATUS.OK });
      },
    };

    this.cmdId += 1;
    debug(`received cmd ${this.cmdId} ${cmd.name}`);

    if (this.state !== 'started') {
      console.log(`Can't process cmd because server state = ${this.state}`);
      return { status: 'notStarted' };
    }

    if (!this.page && !allowedBeforeInitialization.includes(cmd.name)) {
      return ({ status: 'Page is not initialized' });
    }

    if (commands[cmd.name]) {
      debug(`processing cmd: ${JSON.stringify(cmd)}`);
      const response = await commands[cmd.name].call(this);

      if (this.browserErrors.length > 0) {
        this.emit('browserErrors', this.browserErrors);
        this.browserErrors = [];
      }
      return response;
    }
    return { status: 'unknownCmd' };
  }

  async findAll(selector, scope) {
    const pSelector = processSelector(selector);
    let elements;
    if (!scope) {
      scope = this.page;
    }
    if (pSelector.type === 'xpath') {
      elements = await scope.$x(pSelector.path);
    } else {
      elements = await scope.$$(pSelector.path);
    }
    return elements;
  }

  async findOne(selector, scope) {
    const pSelector = processSelector(selector);
    let element;
    if (!scope) {
      scope = this.page;
    }

    if (pSelector.type === 'xpath') {
      const res = await scope.$x(pSelector.path);
      element = res.length > 0 ? res[0] : null;
    } else {
      element = await scope.$(pSelector.path);
    }
    return element;
  }

  async fetchTextFromElement(element) {
    return this.page.evaluate((e) => {
      if (e.innerHTML.includes('&nbsp;')) e.innerHTML = e.innerHTML.replace(/&nbsp;/g, ' '); // заменяем no-break space на обычный пробел
      return e.textContent || e.innerText || e.value || '';
    }, element);
  }

  async fetchText(selector) {
    let text = '';
    const elements = await this.findAll(selector);
    if (elements && elements.length) {
      for (const element of elements) { // eslint-disable-line no-restricted-syntax
        text += await this.fetchTextFromElement(element);
      }
    }
    return text;
  }

  async visible(element, nonZeroBoundingBox) {
    const style = await this.page.evaluate(e => JSON.parse(JSON.stringify(getComputedStyle(e))) // хак для getComputedStyle из-за особенностей Puppeteer (баг)
      , element);
    const bBox = await element.boundingBox();

    if (style && (style.display === 'none' || style.visibility === 'hidden')) {
      return false;
    }

    if (nonZeroBoundingBox && bBox && (bBox.width === 0 || bBox.height === 0)) {
      return false;
    }

    return !!bBox;
  }

  async setFieldValue(fieldSelector, fieldValue, scope) {
    const field = await this.findOne(fieldSelector, scope);
    const fieldFileErrorObject = {
      name: 'FileUploadError',
      message: 'File field must be filled using this.page.uploadFile',
      path: fieldValue,
      id: field.id || null,
    };

    if (!field) {
      const error = new Error(`setField: Invalid field ${fieldSelector}`);
      error.name = 'FieldNotFound';
      throw error;
    }

    const fieldType = await (await field.getProperty('type')).jsonValue();

    switch (fieldType) {
      case 'checkbox':
      case 'radio':
        await this.page.evaluate((e, val) => {
          e.checked = !!val;
        }, field, fieldValue);
        break;
      case 'file':
        throw fieldFileErrorObject;
      case 'select':
        await this.page.select(fieldSelector, fieldValue);
        break;
      case 'text':
      case 'password':
      case 'number':
      case 'search':
      case 'tel':
        await this.page.evaluate((e) => { e.value = ''; }, field);
        await field.type(fieldValue.toString());
        break;
      default:
        await this.page.evaluate((e, val) => {
          e.value = val;
        }, field, fieldValue);
    }

    await this.page.evaluate((fieldArg) => {
      ['change', 'input'].forEach(function (name) {
        const event = document.createEvent('HTMLEvents');
        event.initEvent(name, true, true);
        fieldArg.dispatchEvent(event);
      });
    }, field);

    return true;
  }

  async fill(form, vals, findType = 'css') {
    const out = {
      errors: [],
      fields: [],
      files: [],
    };

    try {
      form = await this.findOne(form);
    } catch (e) {
      if (e.name === 'SYNTAX_ERR') {
        out.errors.push("invalid form selector provided: '" + form + "'");
        return out;
      }
    }

    if (!form) {
      out.errors.push('form not found');
      return out;
    }


    for (const fieldSelector in vals) { // eslint-disable-line no-restricted-syntax
      if (vals.hasOwnProperty(fieldSelector)) {
        try {
          out.fields[fieldSelector] = await this.setFieldValue(fieldSelector, vals[fieldSelector], form);
        } catch (err) {
          switch (err.name) {
            case 'FieldNotFound':
              out.errors.push('Unable to find field element in form: ' + err.toString());
              break;
            case 'FileUploadError':
              out.files.push({
                type: findType,
                selector: findType === 'labels' ? '#' + err.id : fieldSelector,
                path: err.path,
              });
              break;
            default:
              out.errors.push(err.toString());
          }
        }
      }
    }
    return out;
  }
}

function debug(str) {
  if (process.env.DEBUG) {
    console.log(str);
  }
}

function processSelector(selector) {
  const selectorObject = {
    toString() {
      return this.type + ' selector: ' + this.path;
    },
  };
  if (typeof selector === 'string') {
    // defaults to CSS selector
    selectorObject.type = 'css';
    selectorObject.path = selector;
    return selectorObject;
  } else if (typeof selector === 'object') {
    // validation
    if (!selector.hasOwnProperty('type') || !selector.hasOwnProperty('path')) {
      throw new Error('Incomplete selector object');
    } else if (supportedSelectorType.indexOf(selector.type) === -1) {
      throw new Error('Unsupported selector type: ' + selector.type);
    }
    if (!selector.hasOwnProperty('toString')) {
      selector.toString = selectorObject.toString;
    }
    return selector;
  }
  throw new Error('Unsupported selector type: ' + typeof selector);
}

RemoteBrowser.prototype.WAIT_TIMEOUT = browserArgs.waitTimeout || 30000;
RemoteBrowser.prototype.CHECK_INTERVAL = process.env.E2E_TESTS_WITH_PAUSES ? 300 : 50;
RemoteBrowser.prototype.SLOW_MO = browserArgs.slowMo || 0;

RemoteBrowser.deleteLocalStorageBaseDir = function () {
  debug('Deprecation warning: вызов данной функции более не требуется.');
};

module.exports = RemoteBrowser;
