const openPage = require('./open');
const visible = require('./visible');
const initializePage = require('./initialize');
const findAll = require('./findAll');
const findOne = require('./findOne');
const mouseEvent = require('./mouseEvent');
const setFieldValue = require('./setFieldValue');
const fetchTextFromElement = require('./fetchTextFromElement');


module.exports = {
  findOne,
  findAll,
  visible,
  openPage,
  mouseEvent,
  setFieldValue,
  initializePage,
  fetchTextFromElement,
};
