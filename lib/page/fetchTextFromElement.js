/**
 * @param {!RemoteBrowser=} context
 * @param {ElementHandle} element
 * @returns {string}
 */
const fetchTextFromElement = async function fetchTextFromElement(context, element) {
  return context.page.evaluate(
    // заменяем no-break space на обычный пробел
    e => (e.textContent || e.innerText || e.value || '').replace(/\u00a0/g, ' '),
    element,
  );
};

module.exports = fetchTextFromElement;
