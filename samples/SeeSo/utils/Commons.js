/* eslint-disable */
export const delay = (ms, cb) =>
    new Promise((resolve) =>
        setTimeout(() => {
          if (cb) cb();
          resolve();
        }, ms),
    );
