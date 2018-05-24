/**
 * @this RemoteBrowser
 * @param {ElementHandle} element
 * @returns {string}
 */
const fetchTextFromElement = async function fetchTextFromElement(element) {
  return this.page.evaluate((e) => {
    if (e.innerHTML.includes('&nbsp;')) e.innerHTML = e.innerHTML.replace(/&nbsp;/g, ' '); // заменяем no-break space на обычный пробел
    return e.textContent || e.innerText || e.value || '';
  }, element);
};

module.exports = fetchTextFromElement;
