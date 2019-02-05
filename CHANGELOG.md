# Changelog

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
