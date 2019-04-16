/**
 * @param {!RemoteBrowser=} context
 * @param {ElementHandle} element
 * @returns {string}
 */
const fetchTextFromElement = async function fetchTextFromElement(context, element) {
  return context.page.evaluate((e) => {
    if (e.innerHTML.includes('&nbsp;')) e.innerHTML = e.innerHTML.replace(/&nbsp;/g, ' '); // заменяем no-break space на обычный пробел
    return e.innerText || e.textContent || e.value || '';
  }, element);
};

module.exports = fetchTextFromElement;
