# @funboxteam/phantom-lord

<img align="right" width="192" height="192"
     alt="Phantom Lord avatar: Golden shield with a crowned phantom face on a black background"
     src="./logo.png">

[![npm](https://img.shields.io/npm/v/@funboxteam/phantom-lord.svg)](https://www.npmjs.com/package/@funboxteam/phantom-lord)

Handy API for [Headless Chromium](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md), 
inspired by [CasperJS](http://casperjs.org/).

Useful for automated testing, creating website scrapers, and other tasks that require virtual browser.

[По-русски](./README.ru.md)  

## Rationale

There's a library allowing to write tests on Node.js and run them in a virtual browser — 
[Selenium](http://www.seleniumhq.org/). But from our point of view, it has two issues:  

1. It's written in Java.
2. Virtual browser does not always work well. 

In case of any problems it's required to know three programming languages and their tools (Node.js, Java, C++),
otherwise it's hard to debug and takes too much time to solve them.

Trying to solve these issues we'd written our own library — Phantom Lord.

## Features

Headless Chromium is used as a virtual browser, which makes pages look the same as in the usual Chrome with a GUI.

[Puppeteer](https://developers.google.com/web/tools/puppeteer/) is used to control the browser. Unlike CasperJS or 
PhantomJS all the commands are evaluated in Node.js, which allows developers to use ES2015 and other new features of JS,
as well as any libraries written for Node.js. 

## Installation

```bash
npm install --save-dev @funboxteam/phantom-lord
```

## Usage

Require the library:

```js
const Browser = require('@funboxteam/phantom-lord');
```

Create an instance of the browser, setup error handlers and run:

```js
const browser = new Browser();
browser.on('timeout', () => console.log('browser timeout!'));
browser.on('error', () => console.log('browser error!'));
await browser.startRemoteBrowser();
```

Now you're able to run commands:

```javascript
await browser.open('https://google.com');
await browser.waitForText('Google Search');
await browser.sendKeys('input[type="text"]', 'hello');
await browser.click('input[value="Google Search"]');
await browser.waitForUrl('google.com/search');
await browser.waitForText('results');
```

Since the library is just an API for interacting with Headless Chromium, additional tools should be used 
to write E2E tests. E.g. [Mocha](https://mochajs.org/) or 
[@funboxteam/frontend-tests-runner](https://github.com/funbox/frontend-tests-runner). 

<details>
  <summary>Example of Mocha & Phantom Lord integration</summary>
  
  ```js
  const Browser = require('@funboxteam/phantom-lord');
  let browser;
  let restartReason;
  let test;
  
  describe('should test google.com', function() {
    // Do not use arrow fn here to allow Mocha to mock `this`
    before(async function() {
      browser = new Browser();
  
      browser.on('timeout', (e) => {
        console.log('e2e-tests timeout!');

        // Fail the test in case of timeout
        test.callback(e);
      });
  
      browser.on('error', (e) => {
        console.log('e2e-tests error!');

        // Fail the test in case of browser command error
        test.callback(new Error(e)); 
      });
  
      // Handle Phantom Lord internal error (e.g. Chromium crash)
      browser.on('phantomError', (e) => {
        if (browser.testAlreadyFailed) {
          console.log('Chromium error has occurred inside `afterEach`. Failing.');
        } else {
          console.log('Chromium error has occurred. Restarting the test.');
          test.currentRetry(0);
          test.retries(1);
          restartReason = 'phantomError';
          test.callback(new Error(e || 'Error'));
        }
      });
  
      // Handle Chromium exit
      browser.on('exit', (code, signal) => {
        if (browser.state === 'started' || browser.state === 'starting') {
          console.log(`Unexpected Chromium exit with code '${code}' and signal '${signal}'. Restarting the test.`);
          test.currentRetry(0);
          test.retries(1);
          restartReason = 'exit';
          test.callback(new Error('Unexpected Chromium exit'));
        }
      });
  
      // Start the browser when all the handlers are set up
      await browser.startRemoteBrowser();
    });
  
    after(async function() {
      // In the end we have to shut down the browser. Otherwise there will be zombie process.
      await browser.exit();
    });
  
    beforeEach(async function() {
      test = this.currentTest;
    });
  
    afterEach(async function() {
      // In case of failing we can make a screenshot to help ourselves to debug
      if (this.currentTest.state === 'failed') {
        // If the test is failed because of the crash of Chromium it's useless to try to make a screenshot
        if (browser.state !== 'started') {
          console.log(`Not making a screenshot, because browser.state = ${browser.state}`);
        } else {
          let t = this.currentTest;
          const p = [];
          while (t) {
            p.unshift(t.title);
            t = t.parent;
          }
  
          const time = new Date(parseInt(process.env.E2E_TESTS_START_TIMESTAMP, 10));
          p.unshift(time.getTime());
  
          p.unshift('screenshots');
          const fname = `${p.join('/')}.png`;
          browser.testAlreadyFailed = true;
  
          await browser.capture(fname);
        }
      }
  
      // If the test has passed but there're still non-mocked requests then fail the test
      if (browser.browserErrors.length > 0 && this.currentTest.state !== 'failed') {
        test.callback(new Error(browser.browserErrors[0].msg));
      }
  
      // This command will close all the tabs, which leads to opening the new tab when `browser.open()` will be fired
      await browser.closeAllPages();
    });
  
    it('test 1', async () => {
      await browser.open('https://google.com');
      await browser.waitForText('Google Search');
      await browser.sendKeys('input[type="text"]', 'hello');
      await browser.click('input[value="Google Search"]');
      await browser.waitForUrl('google.com/search');
      await browser.waitForText('results'); // If this text won't be found on the page, the test will fail
    });
  
    it('test 2', async () => {
      await browser.open('https://google.com');
      await browser.waitForText('Google Search');
      await browser.sendKeys('input[type="text"]', 'hello');
      await browser.click('input[value="Google Search"]');
      await browser.waitForUrl('google.com/search');
      await browser.waitForText('results'); // If this text won't be found on the page, the test will fail
    });
  });
  ```
  
  Tabs management:
  
  ```js
    it('should open link in a new tab', async () => {
      await browser.open('https://google.com');

      // Let's assume that click on this element will open a page in a new tab
      await browser.click('[data-id="video"]');
  
      // If the new tab won't be open, the test will fail
      await browser.waitForTab(/google\.com\/video/);
      // After the successful check the tab will be closed automatically
    });
  
    it('should open link in a new tab and check it\'s content', async () => {
      await browser.open('https://google.com');
      await browser.click('[data-id="video"]');
  
      await browser.waitForTab(/google\.com\/video/, async () => {
        // This check is evaluated on the page in the new tab
        // If this text won't be found on the page in the new tab, the test will fail
        await browser.waitForText('Videos');
      });
  
      // This check is evaluated on the previous page in the previous tab
      await browser.waitForText('Google Search');
    });
  ```
</details>

## Commands

The list of available commands can be found in [lib/commands/index.js](./lib/commands/index.js).

## Important things to know

### Project root directory

Some commands have to know the path to the project root. E.g. `capture` uses it to create a subdirectory for screenshots.

To find the project root directory Phantom Lord uses [app-root-path](https://www.npmjs.com/package/app-root-path) lib.
And due to [some of its features](https://www.npmjs.com/package/app-root-path#primary-method) one should not store their
project in the directory named `node_modules` or anywhere in it's subdirectories.

* Correct: `~/work/my-project/`.
* Incorrect: `~/work/node_modules/my-project/`.

### Launching the browser

`browser.startRemoteBrowser()` is fired automatically when `browser.open()` is evaluated and the browser hadn't been
launched.

However, if one will try to run any command interacting with a page before launching the browser, they will get 
`notStarted` error.

### Possible edge-cases of commands

#### `sendKeys` 

When `sendKeys` is used to fill in an input with a mask, one should pass the third param (`caretPosition`) with `'start'`
as a value. E.g.:

```js
await browser.sendKeys('.text-field_masked input[type=text]', '9001234567', 'start');
```

Usually if an input has a mask implemented by some JS lib, then the lib sets `value` to the “empty mask” 
(e.g. `value="___ ___-__-__"`) when input is focused. At the same time, default value of `caretPosition` is `'end'`,
which means that the cursor will be placed after `___ ___-__-__`, and the passed text won't be entered, or will be 
entered incorrectly.

### Events

Instance of `RemoteBrowser` emits these events:

* `error` — a critical error has occurred while evaluating a command;
* `timeout` — command evaluation timeout has been reached;
* `phantomError` — an error of sending command to Chromium has occurred
  (usually it means that the process will crash soon);
* `browserErrors` — JS errors have occurred on a page;
* `exit` — Chromium has exited.

`RemoteBrowser` inherits `EventEmitter`, thus to subscribe to events use `on`:

```javascript
browser.on('error', (e) => {
  console.log(`Error: ${e}`);
});
```

### States

At any moment of time `RemoteBrowser` instance may be in one of the following states:

* `notStarted` — Chromium hasn't been started;
* `starting` — Chromium is starting;
* `started` — Chromium has been started and ready to evaluate commands (or evaluating them right now);
* `error` — an error of sending command to Chromium has occurred, and the Chromium should be shut down;
* `exiting` — Chromium is shutting down.

Use `state` property to get the current state:

```js
console.log(`Current state: ${browser.state}`);
```

### Environment variables

* `DEBUG` — boolean; turns on debug logging (sent commands, received replies, console messages, etc).
* `BROWSER_ARGS` — string; allows to tune the browser. The value is JSON setting arguments for virtual browser launch. 
  It may contain the following keys:
    * `viewportWidth` — number; width of the browser viewport (default: `1440`);
    * `viewportHeight` — number; height of the browser viewport (default: `900`);
    * `waitTimeout` — number; timeout for each waiting command (milliseconds) after which it will fail 
      in case of absence of the thing it is waiting for (default: `30000`);
    * `slowMo` — number; slows evaluation of every command on the passed milliseconds (default: `0`). 
      The difference between this key and `E2E_TESTS_WITH_PAUSES` env var is the fact that `slowMo` affects all the actions
      that work with the browser (clicks, navigation, data inputs, keys pressing, etc).
* `E2E_TESTS_WITH_PAUSES` — boolean; increases the delay between waiting commands evaluation (`waitForUrl`, `waitForText`, etc).
  It helps to find errors related to too fast checks evaluation.
* `HEADLESS_OFF` — boolean; turns off Headless mode. The browser will launch with GUI, which will allow to see commands 
  evaluation and interact with it. It may be helpful in debug.

### Stubs

One of the common tasks for E2E tests is to add stubs on a page. Phantom Lord can do it.

#### addStubToQueue

To add the stubs use `addStubToQueue` function. It adds the passed subs to the array `window.stubs` on a page.

The function may be fired even before page loading. In this case the passed data will be added into `window.stubs` right
after the page loading.

The format of the stubs is completely up to you. One thing that should be noted here is
the fact that the passed data will be serialized, which means that they can't link to data from Node.js context.

#### setRequestInterceptor

Also stubs can be done with `setRequestInterceptor` function.
If you pass it a callback it will be called on every network request.
The callback receives [HTTPRequest](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-httprequest) as an
argument.

Usage example:

```js
browser.setRequestInterceptor((request) => {
  const apiPrefix = utils.url('/api');

  if (request.url().indexOf(apiPrefix) === 0) {
    const shortUrl = request.url().replace(apiPrefix, '');
    let foundStub;

    stubs.forEach((stub) => {
      if (stub.method.toLowerCase() === request.method().toLowerCase() && stub.url === shortUrl) {
        foundStub = stub;
      }
    });

    if (foundStub) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(foundStub.data),
      });
      return;
    }

    browser.browserErrors.push({ msg: `Stub not found: ${request.method()} ${shortUrl}` });
  }

  request.continue();
});
```

### Local Storage

Each browser launch is performed with a new profile with it's own unique directory. If any data is added to Local Storage,
it's stored in that directory. And the directory is erased right after the browser closing.

## Earlier versions compatibility

### Page content

The previous versions of the lib used PhantomJS to launch the browser. PhantomJS does not have great support 
of the modern web features, and has “it's own point of view” to the page content. Which means that with the updating 
to the new version (based on Headless Chromium) some differences of page content parsing may be found.

For example PhantomJS ignores non-breaking spaces between words. E.g. it will parse `17&nbsp;640` as “17640”, while
Headless Chromium will save the space and parse the string as “17 640”.

**NB**. If the text content of an element contains non-breaking spaces they will be replaced with regular spaces 
by Phantom Lord (e.g. when using `waitForSelectorText`). So, if some tests fail with the error like this:

```
Error: Expected text of '.dialog__content p' to be 'Do you want to delete your profile?', but it was 'Do you want to delete your profile?'
```

it probably means that the text _of the test_ was copied right from the page with all the non-breaking spaces.
In this case the test should be modified to replace non-breaking spaces with regular ones.

### Click handling

Pay special attention to clicks on “invisible” elements. PhantomJS and Headless Chromium can click on element even when
it's 0×0 sized. But if the element or one of its parents has `display: none` CSS property set, then Headless Chromium
won't be able to click on this element and will throw an `invisibleElement` error, because it won't be able to determine
the element's box model and coordinates.

In case of errors related to clicks on invisible elements, make sure that the elements or their parents do not have
styles that make them fully invisible. Otherwise run one more action before the click that will make invisible element 
visible.

### Local Storage clearing

Since the previous versions of the library were based on PhantomJS, the unique path to Local Storage was created using 
the Phantom Lord library itself and required manual cleaning by calling `Browser.deleteLocalStorageBaseDir()`.

Now the calling of this function is no longer required. 

### Other compatibility issues

If you encounter any other issues related to differences of page display between PhantomJS and Headless Chromium 
while migrating tests from previous versions of the library to a version using Headless Chromium, 
please [create an issue](https://github.com/funbox/phantom-lord/issues/new) to improve this section.

## Development

### Type declarations file

There's `index.d.ts` in the root of the project. It helps IDEs to highlight properties and methods of `RemoteBrowser`
and contains the information about methods' arguments and returned values.

It's recommended to update the declaration file when new commands are added, old ones are removed or there are any other
changes of the class interface. 

For safety reasons, there are tests that check the matching of the methods from the declaration file, 
the commands from `lib/commands` and the `RemoteBrowser` methods.

## Credits

Luxury picture for the project was made by [Igor Garybaldi](https://pandabanda.com/).

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
