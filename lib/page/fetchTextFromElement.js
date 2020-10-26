/**
 * @param {!RemoteBrowser=} context
 * @param {ElementHandle} element
 * @returns {string}
 */
const fetchTextFromElement = async function fetchTextFromElement(context, element) {
  return context.page.evaluate(
    // replace non-breaking space with an ordinary space
    e => (e.textContent || e.innerText || e.value || '').replace(/\u00a0/g, ' '),
    element,
  );
};

module.exports = fetchTextFromElement;
