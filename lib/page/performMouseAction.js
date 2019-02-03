const findAll = require('./findAll');
const visible = require('./visible');
const debug = require('../utils/debug');
const { STATUS } = require('../utils/constants');

/**
 * @param {!RemoteBrowser=} context
 * @param {string} actionType - 'click' или 'hover'
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
