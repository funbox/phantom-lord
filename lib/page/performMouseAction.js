const findAll = require('./findAll');
const visible = require('./visible');
const debug = require('../utils/debug');
const { STATUS } = require('../utils/constants');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} actionType - 'click' or 'hover'
 * @param {string|{type: string, path: string}} selector
 * @param {number=} elementX
 * @param {number=} elementY
 * @returns {Promise<Object.<string, string>>}
 */
const performMouseAction = async function performMouseAction(context, actionType, selector, elementX, elementY) {
  let res = '';
  const visibleElements = [];
  const els = await findAll(context.page, selector);

  if (els.length === 0) {
    return ({ status: STATUS.NOT_FOUND });
  }

  for (const el of els) { // eslint-disable-line no-restricted-syntax
    if (await visible(context, el)) {
      visibleElements.push(el);
    }
  }

  if (visibleElements.length === 0) {
    return ({ status: STATUS.INVISIBLE });
  }

  const overlappingNodeClassName = await context.page.evaluate(async selectorNode => {
    const visibleRatio = await new Promise(resolve => {
      const observer = new IntersectionObserver(entries => {
        resolve(entries[0].intersectionRatio);
        observer.disconnect();
      });
      observer.observe(selectorNode);
    });

    if (visibleRatio !== 1.0) {
      selectorNode.scrollIntoView({
        block: 'center',
        inline: 'center',
      });
    }

    const { left, top } = selectorNode.getBoundingClientRect();

    const x = left + (selectorNode.clientWidth / 2);
    const y = top + (selectorNode.clientHeight / 2);

    const nodeEl = document.elementFromPoint(x, y);

    return nodeEl && !selectorNode.contains(nodeEl) && `.${nodeEl.className.split(' ').join('.')}`;
  }, visibleElements[0]);

  if (overlappingNodeClassName) {
    return ({ status: `${selector} is overlapped by ${overlappingNodeClassName}` });
  }

  try {
    if (elementX && elementY) {
      const { x: elementOffsetLeft, y: elementOffsetTop } = await visibleElements[0].boundingBox();
      const action = actionType === 'click' ? 'click' : 'move';
      await context.page.mouse[action](elementOffsetLeft + elementX, elementOffsetTop + elementY);
    } else {
      await visibleElements[0][actionType]();
    }
    res = STATUS.OK;
  } catch (e) {
    debug(e, 'error');
    res = 'clickError';
  }
  return ({ status: res });
};

module.exports = performMouseAction;
