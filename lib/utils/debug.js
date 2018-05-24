/**
 * @param {string} str
 */
const debug = (str) => {
  if (process.env.DEBUG) {
    console.log(str);
  }
};

module.exports = debug;
