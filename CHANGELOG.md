# Changelog

## 16.0.0 (07.06.2023)

Dropped Node.js 12 support.

The lib probably should still work with it, but you'd better check first.


## 15.2.0 (27.02.2023)

Improved cookie setting process. Now cookies are set prior to opening a new page. 
Which means that request for that page now includes cookies that have been set.


## 15.1.0 (01.03.2022)

Added an ability to automatically clear cookies during a new page creation.


## 15.0.0 (14.02.2022)

Updated `puppeteer` to ^13.3.2 to fix [CVE-2022-0235](https://github.com/advisories/GHSA-r683-j2x4-v87g).

If you depend on the Puppeteer's API then you should check this release notes
for breaking changes:
[v11.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v11.0.0),
[v12.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v12.0.0),
[v13.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v13.0.0).

Also removed default values for first params of commands `expectSelector` and `expectVisibilityState`.
Now the values should be passed explicitly.


## 14.2.0 (08.12.2021)

Support passing options to Puppeteer's `goto` in `open` command.


## 14.1.0 (30.08.2021)

We've improved debug logging a bit.

Earlier when user run Phantom Lord with `DEBUG=1` and there were logged objects in DevTools, 
the objects were printed in debug logs like this:

```
filename.js verbose: CONSOLE: [object Object]
```

Now every logged object or array, or anything is readable:

```
filename.js verbose: CONSOLE: 1
filename.js verbose: CONSOLE: string
filename.js verbose: CONSOLE: null
filename.js verbose: CONSOLE: undefined
filename.js verbose: CONSOLE: [1,2,3]
filename.js verbose: CONSOLE: {"a":1}
filename.js verbose: CONSOLE: Symbol(symbol)
filename.js verbose: CONSOLE: () => {}
filename.js verbose: CONSOLE: function fn() {}
```


## 14.0.0 (23.08.2021)

Now `performMouseAction` scrolls to the passed element when it's not in the viewport.

This is a breaking change and it may affect all the current tests due to the side effects that are caused by the scroll.


## 13.1.0 (19.08.2021)

Now `performMouseAction` checks for overlapping node.

Existing tests might be broken due to the fact, that now this method and its
derivatives throw an error instead of making an action. But they were already 
broken earlier, so this version actually fixes the behaviour.


## 13.0.0 (01.07.2021)

Updated `puppeteer` to ^10.1.0.

If you depend on the Puppeteer's API then you should check this release notes
for breaking changes:
[v6.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v6.0.0),
[v7.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v7.0.0),
[v8.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v8.0.0),
[v9.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v9.0.0),
[v10.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v10.0.0).


## 12.1.1 (10.06.2021)

* Fixed security vulnerabilities.


## 12.1.0 (12.05.2021)

* Added support for xPath selector in `clear` command.

## 12.0.1 (02.03.2021)

* Improved regexp params logging.

## 12.0.0 (21.12.2020)

* Updated `puppeteer` to ^5.0.0.

If you depend on the Puppeteer's API then you should check this release notes
for breaking changes:
[v2.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v2.0.0),
[v3.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v3.0.0),
[v4.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v4.0.0),
[v5.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v5.0.0).

## 11.0.0 (10.11.2020)

* Added `setRequestInterceptor`.
* Reverted "Fix setting test data while navigating to a new page" from 9.3.0,
  which probably has led to breaking backward compatibility.

## 10.0.0 (27.10.2020)

* Added LICENSE.
* Prepared the package for publishing on GitHub.
* Used `puppeteer@^1.18.1` instead of `puppeteer@1.18.1`.
* Updated the deps.

## 9.5.0 (22.09.2020)

* Removed useless param of `waitForSelectorValue`.

## 9.4.0 (30.06.2020)

* Fixed creating screenshots on Windows.

## 9.3.0 (07.05.2020)

* Fixed setting test data while navigating to a new page.

## 9.2.1 (09.04.2020)

* Prevented overriding elements' content.

## 9.2.0 (17.12.2019)

* Improved moving cursor to the end of input before pressing Backspace.

## 9.1.0 (16.10.2019)

* Added moving cursor to the end of the input before pressing Backspace.

## 9.0.0 (06.10.2019)

* Removed useless deps.

## 8.1.0 (06.10.2019)

* Updated Mocha to 6.2.1.

## 8.0.2 (24.09.2019)

* Fixed reporting error of non found element.

## 8.0.1 (20.09.2019)

* Fixed clearing input value with large amount of symbols.

## 8.0.0 (17.07.2019)

* Added waiting for element in commands `click` & `clickSelectorText`.

## 7.1.0 (04.07.2019)

* Updated Puppeteer to 1.18.1.

## 7.0.0 (05.06.2019)

* Returned `textContent` instead of `innerText` in `fetchTextFromElement`.

## 6.13.0 (23.05.2019)

* Fixed browser errors handling.

## 6.12.0 (23.05.2019)

* Added installation info to README.

## 6.11.0 (16.04.2019)

* Returned `innerText` instead of `textContent` in `fetchTextFromElement`.

## 6.10.0 (30.03.2019)

* Added `waitForEventListener` cmd.

## 6.9.1 (27.03.2019)

* Added argument `--allow-insecure-localhost` to Puppeteer launch cmd.

## 6.9.0 (18.03.2019)

* Replaced nbsp with normal space in `waitForText` command.

## 6.8.1 (11.03.2019)

* Add preventing proxing own prototype methods through `checkCommand`.

## 6.8.0 (06.03.2019)

* Replaced `clear` cmd with `clearTextField`.

## 6.7.0 (26.02.2019)

* Added `clearTextField` command.

## 6.6.0 (21.02.2019)

* Added type declaration file.

## 6.5.1 (05.02.2019)

* Fixed firing `performMouseAction` for hover.

## 6.5.0 (10.01.2019)

* Added support for browser tabs.

## 6.4.1 (10.01.2019)

* Added `sendKeys` docs to README.

## 6.4.0 (14.12.2018)

* Added setting cursor position in `sendKeys` cmd.

## 6.3.0 (18.10.2018)

* Separated browser firing from page opening.

## 6.2.2 (18.10.2018)

* Added output msg of browser's console when error occurs in `console` event.

## 6.2.1 (28.09.2018)

* Replaced emitting `browserErrors` event to throwing error.

## 6.2.0 (06.09.2018)

* Improved README.

## 6.1.0 (04.09.2018)

* Fixed behavoir of `waitWhileVisible` and `waitUntilVisible`.

## 6.0.1 (16.07.2018)

* Fix 'Unhandled promise rejection' before closing the browser.

## 6.0.0 (31.07.2018)

* Move from stepped evaluation model derived from Casper to proper async-await.

## 5.1.0 (27.07.2018)

* Colorized debug logs.
* Added output stack trace for console errors.

## 5.0.2 (27.07.2018)

* Fixed app project root path calculation.

## 5.0.1 (13.07.2018)

* Fixed path to Phantom Lord while running the project.

## 5.0.0 (06.07.2017)

* Moved the package into the @funboxteam scope.

## 4.0.1 (15.06.2018)

* Removed `checkCmd` call in `clear` command.
* Fixed error that occurred when one was getting element's text.

## 4.0.0 (14.06.2018)

* Split index.js on separated modules and renamed some of them.

## 3.2.0 (07.06.2018)

* Added correct stack trace generation in cmds w/o delays.

## 3.1.0 (31.05.2018)

* Added `clickSelectorText` method.

## 3.0.2 (16.05.2018)

* Fixed `E2E_TEST_WITH_PAUSES` behavior.

## 3.0.1 (15.05.2018)

* Fixed click and hover on elements by coords.

## 3.0.0 (14.05.2018)

* Moved from PhantomJS to Puppeteer.

## 2.7.0 (11.05.2018)

* Added `clear` method for inputs.

## 2.6.1 (04.05.2018)

* Fixed regexp support in mocks.

## 2.6.0 (26.04.2018)

* Added ESLint.

## 2.5.0 (26.04.2018)

* Added Windows support.

## 2.4.0 (02.03.2018)

* Added `addLocalStorageItemToQueue`.

## 2.3.0 (06.02.2018)

* Made path to `localStorage` unique.

## 2.2.0 (29.01.2018)

* Added `addCookieToQueue`.

## 2.1.0 (08.11.2017)

* Added note about `devtool` param to README.

## 2.0.0 (01.11.2017)

* Renamed the package to `funbox-phantom-lord`.

## 1.16.0 (31.10.2017)

* Improved the docs.

## 1.15.0 (19.10.2017)

* Renamed `window.mocks` to `window.stubs`.

## 1.14.0 (18.10.2017)

* Fixed waitUntilVisible.

## 1.13.0 (13.10.2017)

* Added clickViaOther method.

## 1.12.0 (13.10.2017)

* Improved stack trace logging when timeout fail occurs.

## 1.11.0 (04.10.2017)

* Changed used ports range to prevent conflicts on CI.

## 1.10.0 (04.10.2017)

* Increased used ports range.

## 1.9.0 (04.10.2017)

* Improved PhantomJS not-started state handling.
* Added logging PhantomJS response parsing error.
* Added logging PhantomJS port.
* Added logging original cmd when parsing error occurs.

## 1.8.0 (03.10.2017)

* Added `browserErrors` event to handle JS errors of test pages.

## 1.7.0 (28.09.2017)

* Improved timeouts and errors generation.

## 1.6.0 (28.09.2017)

* Added setting `state = exiting` when `exit` fn is fired.

## 1.5.1 (01.09.2017)

* Limited printing Phantom.JS logs. Now they're shown only when env variable is passed.

## 1.5.0 (01.09.2017)

* Added exit event emitting for PhantomJS finishing.

## 1.4.0 (01.09.2017)

* Move PhantomJS error into the separated event.
  Now `error` is an ordinary error which should fail the test,
  while `phantomError` is something horrible that is not related to the test itself.
* Added debug info.

## 1.3.0 (31.08.2017)

* Removed `then()` wrapping for capturing methods.

## 1.2.2 (24.08.2017)

* Moved mocks logic into the browser.
* Fixed waitForSelectorText & waitForSelectorValue.

## 1.2.1 (21.08.2017)

* Fixed tests filtering.

## 1.2.0 (16.08.2017)

* Add waiting for server process finish.

## 1.1.0 (16.08.2017)

* Added printing errors for functions frozen on timeout.

## 1.0.0 (10.08.2017)

* Initial version.
