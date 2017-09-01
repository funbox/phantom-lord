# Changelog

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
