/* eslint-disable no-prototype-builtins */
const supportedSelectorType = ['css', 'xpath'];

const processSelectorType = (selector) => {
  const selectorObject = {
    toString() {
      return `${this.type} selector: ${this.path}`;
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
      throw new Error(`Unsupported selector type: ${selector.type}`);
    }
    if (!selector.hasOwnProperty('toString')) {
      selector.toString = selectorObject.toString;
    }
    return selector;
  }
  throw new Error(`Unsupported selector type: ${typeof selector}`);
};

module.exports = processSelectorType;
