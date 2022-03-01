const EventEmitter = require('events').EventEmitter;
const puppeteer = require('puppeteer');

const commandsList = require('./lib/commands');
const { debug, onCloseCb, checkCmd } = require('./lib/utils');
const { STATE } = require('./lib/utils/constants');

const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');

const proxyHandler = {
  get(target, property) {
    if (Object.keys(commandsList).includes(property)) {
      target.cmdId += 1;
      return (...args) => {
        checkCmd(target, property, commandsList[property].skipBrowserErrorsCheck, ...args);
        return commandsList[property](target, ...args);
      };
    }
    return target[property];
  },
};

/**
 * @param {JSHandle<ConsoleMessage>} handle
 * @returns {Promise<string>}
 */
async function stringifyMessageHandle(handle) {
  const res = await handle.executionContext().evaluate(m => {
    const valueToStringify = (m && m.stack) || m;

    if (typeof valueToStringify === 'object') {
      return JSON.stringify(valueToStringify);
    }

    return String(valueToStringify);
  }, handle);
  return res;
}

class RemoteBrowser extends EventEmitter {
  constructor() {
    super();
    this.state = STATE.NOT_STARTED;
    this.chromium = null;
    this.page = null;
    this.sessionCDP = null;
    this.cmdId = 0;
    this.browserErrors = [];
    this.stubsQueue = [];
    this.cookiesQueue = [];
    this.localStorageItemsQueue = [];
    this.testSettings = {};
    this.isInitialized = false;
    this.CDPConnectionsInProgress = 0;
    this.requestInterceptor = null;

    this.onCloseCallback = (...args) => { onCloseCb(this, 'close', ...args); };
    this.onExitCallback = (...args) => { onCloseCb(this, 'exit', ...args); };

    // we are using Proxy here so returning is fine
    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, proxyHandler);
  }

  async startRemoteBrowser() {
    if (this.state !== STATE.NOT_STARTED) return;
    this.state = STATE.STARTING;

    try {
      this.chromium = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-insecure-localhost'],
        headless: this.HEADLESS,
        slowMo: this.SLOW_MO,
      });
      this.pid = this.chromium.process().pid;
      this.chromium.process().on('close', this.onCloseCallback);
      this.chromium.process().on('exit', this.onExitCallback);

      this.chromium.on('targetcreated', async (target) => {
        const page = await target.page();
        if (!page) return;

        page.on('error', (error) => {
          debug(`Browser page unexpectedly crashed. Reason: ${error.message}`, 'error');
          this.emit('exit', 1, 'SIGKILL');
        });

        page.on('console', async (message) => {
          const severityLevel = message.type() === 'error' ? 'error' : 'verbose';

          try {
            this.CDPConnectionsInProgress += 1;
            const args = await Promise.all(message.args()
              .map(stringifyMessageHandle));
            debug(`CONSOLE: ${args.join(' ')}`, severityLevel);
          } catch (e) {
            debug(`CONSOLE: ${message.text()}`, severityLevel);
            debug(`Non critical error: ${e.message}`, 'warn');
          } finally {
            this.CDPConnectionsInProgress -= 1;
          }
        });

        page.on('pageerror', (error) => {
          const { message } = error;
          const notCriticalErrors = [
            'ymaps: script not loaded',
            '[WDS] Disconnected!',
          ];

          if (notCriticalErrors.indexOf(message) >= 0) {
            debug(`Non critical error: ${message}`, 'warn');
          } else {
            debug(message, 'error');
            this.browserErrors.push({ msg: message });
          }
        });

        page.on('framenavigated', async (frame) => {
          debug(`Redirected to ${frame.url()}`, 'info');
        });

        if (this.CLEAR_COOKIES) {
          this.sessionCDP = await target.createCDPSession();

          await this.sessionCDP.send('Storage.clearCookies');
        }

        if (this.requestInterceptor) {
          await page.setRequestInterception(true);
          page.on('request', (request) => {
            this.requestInterceptor(request);
          });
        }
      });

      debug(`Puppeteer ${this.pid}: Remote browser has been started. Current version: ${await this.chromium.version()}`, 'info');
      console.log(`Puppeteer ${this.pid}: start processing commands`);

      this.state = STATE.STARTED;
    } catch (error) {
      debug(`debug: ${error.toString()}`, 'error');
      this.emit('phantomError', error.message);
    }
  }

  async closePage() {
    this.isInitialized = false;

    this.stubsQueue = [];
    this.cookiesQueue = [];
    this.localStorageItemsQueue = [];
    this.browserErrors = [];

    if (this.page) {
      const connection = this.sessionCDP && await this.sessionCDP.connection();

      if (connection) {
        await this.sessionCDP.detach();
        this.sessionCDP = null;
      }

      await this.page.close();
      this.page = null;
    }
  }

  async closeAllPages() {
    await this.closePage();

    const pages = await this.chromium.pages();

    for (let i = this.HEADLESS ? 0 : 1; i < pages.length; i += 1) {
      await pages[i].close();
    }
  }

  exit() {
    if (this.page) {
      this.page.removeAllListeners('console');
    }

    if (!this.chromium || !this.chromium.process()) {
      this.state = STATE.NOT_STARTED;
      return null;
    }

    this.state = STATE.EXITING;

    const startWaitingTime = +new Date();

    return new Promise((resolve, reject) => {
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
        if (self.state === STATE.NOT_STARTED) {
          resolve();
        } else {
          notKilled();
        }
      }

      new Promise((CDPResolve) => {
        const CDPWaiter = setInterval(() => {
          if (!self.CDPConnectionsInProgress) {
            clearInterval(CDPWaiter);
            CDPResolve();
          }
        }, 5);
      })
        .then(() => this.chromium.close())
        .then(() => waiter());
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

  setRequestInterceptor(callback) {
    this.requestInterceptor = callback;
  }
}

RemoteBrowser.prototype.WAIT_TIMEOUT = browserArgs.waitTimeout || 30000;
RemoteBrowser.prototype.CHECK_INTERVAL = process.env.E2E_TESTS_WITH_PAUSES ? 300 : 50;
RemoteBrowser.prototype.SLOW_MO = browserArgs.slowMo || 0;
RemoteBrowser.prototype.CLEAR_COOKIES = browserArgs.clearCookies || false;
RemoteBrowser.prototype.HEADLESS = !(process.env.HEADLESS_OFF || browserArgs.headlessOff);

RemoteBrowser.deleteLocalStorageBaseDir = function () { // eslint-disable-line func-names
  debug('Deprecation warning: deleteLocalStorageBaseDir should not be fired anymore.', 'warn');
};

module.exports = RemoteBrowser;
