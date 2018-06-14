/**
 * @param {!RemoteBrowser=} context
 * @param {number} timeout
 */
module.exports = function wait(context, timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};
