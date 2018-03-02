var utils = require('./utils.js');
var page = require('webpage').create();
var webserver = require('webserver');
var server = webserver.create();
var fs = require('fs');
var waiters = [];

var CHECK_INTERVAL = 50;

var START_PORT = 10100;
var END_PORT = 10200;
var port = START_PORT;
var listening = false;
var system = require('system');

var browserArgs = JSON.parse(system.args[1]);
var width = browserArgs.viewportWidth || 1440;
var height = browserArgs.viewportHeight || 900;

page.viewportSize = {width: width, height: height};
var stubsQueue = [];
var cookiesQueue = [];
var localStorageItemsQueue = [];
var testSettings = {};
var isInitialized = false;
cmdId = 0;

var browserErrors = [];

while (!listening) {
  var listening = server.listen(port, processRequest);

  if (!listening) {
    port++;
    if (port > END_PORT) {
      console.log("Can't start server, exiting");
      phantom.exit();
    }
  } else {
    console.log("Server started at " + port);
  }
}

page.onUrlChanged = function() {
  if (page.injectJs('clientutils.js')) {
    page.evaluate(function() {
      window.__utils__ = new window.ClientUtils({});
    });
  }
};

page.onInitialized = function onInitialized() {
  isInitialized = true;
  page.evaluate(function(settings) {
      window.test = settings;
    }, testSettings);
  if (stubsQueue.length > 0) {
    page.evaluate(function(stubs) {
      window.stubs = [];
      for(var i = 0; i < stubs.length; i++) {
        var stub = stubs[i];
        window.stubs.push({ method: stub.method, url: stub.url, data: stub.data });
      }
    }, stubsQueue)
  }

  if (cookiesQueue.length > 0) {
    page.evaluate(function(cookie) {
      for (var i = 0; i < cookie.length; i++) {
        document.cookie = [cookie[i].name, cookie[i].value].join('=');
      }
    }, cookiesQueue)
  }

  if (localStorageItemsQueue.length > 0) {
    page.evaluate(function(items) {
      for (var i = 0; i < items.length; i++) {
        localStorage.setItem(items[i].key, items[i].value);
      }
    }, localStorageItemsQueue)
  }
};
// Включение вывода console.log с сайта
page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log('CONSOLE: ' + msg);
};

page.onError = function(msg, trace) {
  var notCriticalErrors = [
    'ymaps: script not loaded',
    '[WDS] Disconnected!',
  ];

  if (notCriticalErrors.indexOf(msg) >= 0) {
    console.log('Некритическая ошибка: ' + msg);
  } else {
    browserErrors.push({msg: msg, trace: trace});

    var msgStack = ['ERROR: ' + msg];

    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
      });
    }
    console.log(msgStack.join('\n'));
  }
};

function processRequest(request, response) {
  var cmd = '';
  try {
    cmd = JSON.parse(request.post);
  } catch(e) {
    console.log("Error: " + JSON.stringify(e) + ", original string: " + request.post);
  }
  response.headers = {"Cache": "no-cache", "Content-Type": "application/json"};
  response.statusCode = 200;
  if (cmd) {
    ++cmdId;
    console.log('received cmd:',cmdId, cmd.name);
    processCmd(cmd, response);
  } else {
    response.write(JSON.stringify({status: 'cmdParseError', cmd: request.post}));
    response.close();
  }
}

function processCmd(cmd, response) {
  function respondWith(data) {
    if (browserErrors.length > 0) {
      data.browserErrors = browserErrors;
      browserErrors = [];
    }

    response.write(JSON.stringify(data));
    response.close();
  }

  function getElementInfo(selector) {
    return page.evaluate(function(selector) {
      return __utils__.getElementInfo(selector);
    }, selector);
  }

  var commands = {
    open: function() {
      page.open(cmd.params.url, function(status) {
        if(status === "success") {
          respondWith({status: 'ok'});
        } else {
          respondWith({status: 'error'});
        }
      });
    },

    exit: function() {
      respondWith({status: 'ok'});
      setTimeout(function() { phantom.exit(0); }, 100);
    },

    getPlainText: function() {
      respondWith({status: 'ok', result: page.plainText});
    },

    getCurrentUrl: function() {
      var url = page.evaluate(function() {
        return document.location.href;
      })
      respondWith({status: 'ok', result: utils.decodeUrl(url)});
    },

    checkSelectorExists: function() {
      var res = page.evaluate(function(sel) {
        return __utils__.findAll(sel).length > 0;
      }, cmd.params.selector);
      respondWith({status: res ? 'ok': 'notFound'});
    },

    checkSelectorText: function() {
      var res = page.evaluate(function(sel) {
        return __utils__.fetchText(sel);
      }, cmd.params.selector);
      var text = cmd.params.text;
      var exactMatch = cmd.params.exactMatch;
      if (exactMatch && res === text || !exactMatch && res.indexOf(text) >= 0) {
        respondWith({status: 'ok'});
      } else {
        respondWith({status: 'notFound', text: res});
      }
    },

    checkSelectorValue: function() {
      var res = page.evaluate(function(sel) {
        var el = window.__utils__.findOne(sel);
        return el ? el.value : undefined;
      }, cmd.params.selector);
      var value = cmd.params.value;
      if (res === value) {
        respondWith({status: 'ok'});
      } else {
        respondWith({status: 'notEqual', value: res});
      }
    },

    checkVisibility: function() {
      var res = page.evaluate(function(sel) {
        return __utils__.visible(sel);
      }, cmd.params.selector);
      respondWith({status: res ? 'ok': 'notFound'});
    },

    evaluate: function() {
      var args = cmd.params.args;
      args.unshift(cmd.params.fn);
      var res = page.evaluate.apply(page, args);
      respondWith({status: 'ok', result: res});
    },

    click: function() {
      var res = page.evaluate(function(sel, x, y) {
        var el = window.__utils__.findOne(sel);
        if (!el) return 'notFound';
        el.focus();
        if (!__utils__.visible(sel)) return 'invisibleElement';
        if (!__utils__.mouseEvent('mouseDown', sel, x, y)) return 'mouseDownError';
        if (!__utils__.mouseEvent('mouseUp', sel, x, y)) return 'mouseUpError';
        if (!__utils__.mouseEvent('click', sel, x, y)) return 'clickError';
        return 'ok';
      }, cmd.params.selector, cmd.params.x, cmd.params.y);
      respondWith({status: res});
    },

    clickViaOther: function() {
      var res = page.evaluate(function(sel, otherSel) {
        var el = window.__utils__.findOne(sel);
        if (!el) return 'notFound';

        var otherEl = window.__utils__.findOne(otherSel);
        if (!otherEl) return 'notFoundOther';

        if (!__utils__.visible(sel)) return 'invisibleElement';
        if (!__utils__.visible(otherSel)) return 'invisibleElementOther';

        otherEl.focus();

        var rect = el.getBoundingClientRect();
        var x = (rect.left + rect.right) / 2;
        var y = (rect.top + rect.bottom) / 2;

        if (!__utils__.mouseEvent('mouseDown', otherSel, x, y)) return 'mouseDownError';
        if (!__utils__.mouseEvent('mouseUp', otherSel, x, y)) return 'mouseUpError';
        if (!__utils__.mouseEvent('click', otherSel, x, y)) return 'clickError';

        return 'ok';
      }, cmd.params.selector, cmd.params.otherSelector);
      respondWith({status: res});
    },

    sendKeys: function() {
      var selector = cmd.params.selector;
      var keys = cmd.params.keys;
      var options = cmd.params.options;
      options = utils.mergeObjects({
          eventType: 'keypress',
          reset: false
      }, options || {});
      var elemInfos = getElementInfo(selector);
      var tag = elemInfos.nodeName.toLowerCase();
      var type = utils.getPropertyPath(elemInfos, 'attributes.type'),
        supported = ["color", "date", "datetime", "datetime-local", "email",
          "hidden", "month", "number", "password", "range", "search",
          "tel", "text", "time", "url", "week"];
      var isTextInput = false;
      var isTextArea = tag === 'textarea';
      var isValidInput = tag === 'input' && (typeof type === 'undefined' || supported.indexOf(type) !== -1);
      var isContentEditable = !!elemInfos.attributes.contenteditable;

      var modifiers = utils.computeModifier(options && options.modifiers,
                                          page.event.modifier);
      page.sendEvent('keypress', keys, null, null, modifiers);
      if (isTextInput) {
        // remove the focus
        page.evaluate(function(selector) {
          __utils__.findOne(selector).blur();
        }, selector);
      }
      respondWith({status: 'ok'});
    },

    capture: function() {
      var filename = cmd.params.filename;
      filename = fs.absolute(filename);
      page.render(filename);
      respondWith({status: 'ok'});
    },

    captureInPath: function() {
      var p = cmd.params.path;
      p = p.split('/');
      var dir = p.slice(0, p.length - 1).join('/');
      if (!fs.exists(dir)) {
        fs.makeTree(dir);
      }
      var fname = p.join('/') + '.png';
      var filename = fs.absolute(fname);
      page.render(filename);
      respondWith({status: 'ok'});
    },

    addCookieToQueue: function() {
      var cookie = cmd.params.cookie;
      if (isInitialized) {
        page.evaluate(function(name, value) {
          document.cookie = [name, value].join('=');
        }, cookie.name, cookie.value);
      } else {
        cookiesQueue.push(cookie);
      }
      respondWith({ status: 'ok' });
    },

    addLocalStorageItemToQueue: function() {
      var item = cmd.params.item;
      if (isInitialized) {
        page.evaluate(function(key, value) {
          localStorage.setItem(key, value);
        }, item.key, item.value);
      } else {
        localStorageItemsQueue.push(item);
      }
      respondWith({ status: 'ok' });
    },

    addStubToQueue: function() {
      var stub = cmd.params.stub;
      if (isInitialized) {
        page.evaluate(function(method, url, data) {
          window.stubs = window.stubs || [];
          window.stubs.push({ method: method, url: url, data: data });
        }, stub.method, stub.url, stub.data);
      } else {
        stubsQueue.push(stub);
      }
      respondWith({status: 'ok'});
    },

    addTestSetting: function() {
      var key = cmd.params.setting;
      var value = cmd.params.value;
      testSettings[key] = value;
      respondWith({status: 'ok'});
    },

    getCount: function() {
      var selector = cmd.params.selector;
      var count = page.evaluate(function(contextSelector) {
        var found = contextSelector ? window.__utils__.findAll(contextSelector) : [];
        return found.length;
      }, selector);
      respondWith({status: 'ok', result: count});
    },

    fillForm: function() {
      var selector = cmd.params.selector;
      var vals = cmd.params.vals;
      var options = cmd.params.options;
      var selectorType = options && options.selectorType || "names",
        submit = !!(options && options.submit);

      var fillResults = page.evaluate(function(selector, vals, selectorType) {
        try {
          return __utils__.fill(selector, vals, selectorType);
        } catch (exception) {
          return {exception: exception.toString()};
        }
      }, selector, vals, selectorType);
      if (!fillResults) {
        respondWith({status: 'error'});
      }
      if (fillResults.files && fillResults.files.length > 0) {
        if (utils.isObject(selector) && selector.type === 'xpath') {
            console.log('Error: fillForm не поддерживает xpath, используйте обычный селектор');
        } else {
          fillResults.files.forEach(function(file) {
            if (!file || !file.path) {
              return;
            }
            var paths = (utils.isArray(file.path) && file.path.length > 0) ? file.path : [file.path];
            paths.map(function(filePath) {
                if (!fs.exists(filePath)) {
                  console.log('Error: нельзя загрузить несуществующий файл');
                  respondWith({status: 'error'});
                }
              },this);
            var fileFieldSelector;
            if (file.type === "names") {
              fileFieldSelector = [selector, 'input[name="' + file.selector + '"]'].join(' ');
            } else if (file.type === "css" || file.type === "labels") {
              fileFieldSelector = [selector, file.selector].join(' ');
            }
            page.uploadFile(fileFieldSelector, paths);
          }.bind(this));
        }
      }
      // Form submission?
      if (submit) {
        page.evaluate(function _evaluate(selector) {
          var form = __utils__.findOne(selector);
          var method = (form.getAttribute('method') || "GET").toUpperCase();
          var action = form.getAttribute('action') || "unknown";
          __utils__.log('submitting form to ' + action + ', HTTP ' + method, 'info');
          var event = document.createEvent('Event');
          event.initEvent('submit', true, true);
          if (!form.dispatchEvent(event)) {
            __utils__.log('unable to submit form', 'warning');
            return;
          }
          if (typeof form.submit === "function") {
            form.submit();
          } else {
            // http://www.spiration.co.uk/post/1232/Submit-is-not-a-function
            form.submit.click();
          }
        }, selector);
      }
      respondWith({status: 'ok'});
    },
  };

  if (commands[cmd.name]) {
    commands[cmd.name]();
  } else {
    respondWith({status: 'unknownCmd'});
  }
}
