/**
 * @param {number} timeout
 */
module.exports = function wait(timeout) {
  return this.then(() => new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  }));
};
