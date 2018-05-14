module.exports = function waitFor(fn, onTimeout) {
  const errorWithUsefulStack = new Error();
  const startWaitingTime = +new Date();
  return this.then(() => new Promise((resolve, reject) => {
    const self = this;
    function condNotSatisfied(error) {
      const currentTime = +new Date();

      if (currentTime - startWaitingTime < self.WAIT_TIMEOUT) {
        setTimeout(() => waiter(), self.CHECK_INTERVAL);
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
