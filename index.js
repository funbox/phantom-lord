const EventEmitter = require('events').EventEmitter;
const puppeteer = require('puppeteer');

const commandsList = require('./lib/commands');
const openPage = require('./lib/page/open');
const { debug, onCloseCb } = require('./lib/utils');

const browserArgs = JSON.parse(process.env.BROWSER_ARGS || '{}');

const proxyHandler = {
  get(target, property) {
    if (property in commandsList) {
      return (...args) => commandsList[property](target, ...args);
    }
    return target[property];
  },
};

// eslint-disable-next-line no-extend-native
RegExp.prototype.toJSON = function toJSON() { return `re:${this.source}`; }; // для сохранения regexp в моках

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

      debug(`Puppeteer ${this.pid}: Remote browser has been started. Current version: ${await this.chromium.version()}`);
      console.log(`Puppeteer ${this.pid}: start processing steps`);

      this.state = 'started';
      this.stepInsertOffset = 1;
      this.processSteps();
    } catch (error) {
      debug(`debug: ${error.toString()}`);
      this.emit('phantomError', error.message);
    }
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
            this.emit('error', e instanceof Error ? e : new Error(e));
          }
        });
      } else {
        processNext(stepRes);
      }
    } catch (e) {
      this.emit('error', e);
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
  debug('Deprecation warning: вызов функции deleteLocalStorageBaseDir более не требуется.');
};


module.exports = RemoteBrowser;
