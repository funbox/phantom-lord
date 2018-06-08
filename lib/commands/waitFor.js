/**
 * @param {Function} fn
 * @param {Function=} onTimeout
 */
module.exports = function waitFor(context, fn, onTimeout) {
  const errorWithUsefulStack = new Error();
  const startWaitingTime = +new Date();
  return context.then(() => new Promise((resolve, reject) => {
    function condNotSatisfied(error) {
      const currentTime = +new Date();

      if (currentTime - startWaitingTime < context.WAIT_TIMEOUT) {
        setTimeout(() => waiter(), context.CHECK_INTERVAL);
      } else {
        if (onTimeout) onTimeout();
        errorWithUsefulStack.message = error;
        reject({ type: 'timeout', data: errorWithUsefulStack });
      }
    }

    function waiter() {
      // TODO: Добавить try/catch
      const res = fn();
      if (res && res.then) {
        res.then(() => {
          resolve();
        }, (error) => {
          condNotSatisfied(error);
        });
      } else if (res) {
        resolve();
      } else {
        condNotSatisfied();
      }
    }

    waiter();
  }));
};
