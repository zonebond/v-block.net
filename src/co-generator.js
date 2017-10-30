/**
 * co function
 * @param generator
 * @param args
 * @returns {Promise}
 */
export default function co(generator, ...args) {
  return new Promise((resolve) => {
    const gen = generator(...args);

    fulfilled(...args);

    function fulfilled(...result) {
      const ret = gen.next(...result);
      next(ret);
    }

    function next(ret) {
      if (ret.done) {
        resolve(ret.value);
      } else {
        const value = ret.value;
        if (typeof value.then === 'function') {
          value.then(fulfilled);
        } else if (typeof value === 'function') {
          value.call(this, fulfilled);
        } else {
          fulfilled(value);
        }
      }
    }
  });
}

/**
 * sleep
 * @param ms
 * @returns {Function}
 */
export function sleep(ms) {
  console.log(`start sleep`);
  return function(next) {
    setTimeout(() => {
      console.log(`stop sleep`);
      next();
    }, ms);
  }
}