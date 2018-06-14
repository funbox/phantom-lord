const { replaceNbsp } = require('../utils');
/**
 * @param {!RemoteBrowser=} context
 * @param {ElementHandle} element
 * @returns {string}
 */
const fetchTextFromElement = async function fetchTextFromElement(context, element) {
  return context.page.evaluate((e) => {
    if (e.innerHTML.includes('&nbsp;')) e.innerHTML = replaceNbsp(e.innerHTML); // заменяем no-break space на обычный пробел
    return e.textContent || e.innerText || e.value || '';
  }, element);
};

module.exports = fetchTextFromElement;
