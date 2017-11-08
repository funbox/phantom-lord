# Changelog

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

* Added browserError event to handle JS errors of test pages.

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
