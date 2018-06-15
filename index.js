const EventEmitter = require('events').EventEmitter;
const puppeteer = require('puppeteer');

const commandsList = require('./lib/commands');
const openPage = require('./lib/page/open');
const { debug, onCloseCb, checkCmd } = require('./lib/utils');

const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');

const proxyHandler = {
  get(target, property) {
    if (property in commandsList) {
      target.cmdId += 1;
      return (...args) => {
        checkCmd(target, property, ...args);
        return commandsList[property](target, ...args);
      };
    }
    return target[property];
  },
};

class RemoteBrowser extends EventEmitter {
  constructor() {
    super();
    this.state = 'notStarted';
    this.chromium = null;
    this.page = null;
    this.cmdId = 0;
    this.browserErrors = [];
    this.stubsQueue = [];
    this.cookiesQueue = [];
    this.localStorageItemsQueue = [];
    this.testSettings = {};
    this.isInitialized = false;

    this.onCloseCallback = (...args) => { onCloseCb(this, 'close', ...args); };
    this.onExitCallback = (...args) => { onCloseCb(this, 'exit', ...args); };

    return new Proxy(this, proxyHandler);
  }

  async startRemoteBrowser() {
    if (this.state !== 'notStarted') return;
    this.state = 'starting';

    try {
      this.chromium = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: this.HEADLESS,
        slowMo: this.SLOW_MO,
      });
      this.pid = this.chromium.process().pid;
      this.chromium.process().on('close', this.onCloseCallback);
      this.chromium.process().on('exit', this.onExitCallback);

      this.page = await openPage(this);

      debug(`Puppeteer ${this.pid}: Remote browser has been started. Current version: ${await this.chromium.version()}`, 'info');
      console.log(`Puppeteer ${this.pid}: start processing commands`);

      this.state = 'started';
    } catch (error) {
      debug(`debug: ${error.toString()}`, 'error');
      this.emit('phantomError', error.message);
    }
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
        debug(`debug: browser state: ${this.state}`, 'debug');

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

  xpath(expression) { // eslint-disable-line class-methods-use-this
    return {
      type: 'xpath',
      path: expression,
      toString() {
        return `${this.type} selector: ${this.path}`;
      },
    };
  }
}

RemoteBrowser.prototype.WAIT_TIMEOUT = browserArgs.waitTimeout || 30000;
RemoteBrowser.prototype.CHECK_INTERVAL = process.env.E2E_TESTS_WITH_PAUSES ? 300 : 50;
RemoteBrowser.prototype.SLOW_MO = browserArgs.slowMo || 0;
RemoteBrowser.prototype.HEADLESS = !(process.env.HEADLESS_OFF || browserArgs.headlessOff);

RemoteBrowser.deleteLocalStorageBaseDir = function () { // eslint-disable-line func-names
  debug('Deprecation warning: вызов функции deleteLocalStorageBaseDir более не требуется.', 'warn');
};


module.exports = RemoteBrowser;
