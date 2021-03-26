/* eslint-disable */
import {delay} from './Commons';

class InstantThread {

  constructor(min_interval_ms) {
    if (!min_interval_ms) throw new Error('min_interval_ms required');
    this.current_interval_ms = min_interval_ms;
    this.min_interval_ms = min_interval_ms;
    this.flag = false;
    this.running = true;
    this.func = () => {};
    (() => {
      (async () => {
        while (this.running) {

          if (this.flag === true) {

            const before_ms = Date.now();
            await this.func();
            const after_ms = Date.now();

            const execute_ms = after_ms - before_ms;

            const diff_ms = this.current_interval_ms - execute_ms;

            if (0 < diff_ms) {
              await delay(diff_ms);
              // if(this.current_interval_ms > this.min_interval_ms){
              //     this.current_interval_ms = Math.max(this.min_interval_ms, this.current_interval_ms - (diff_ms / 5))
              // }
            } else {
              // FPS = Math.floor(1000 / latency);
              // await delay(- diff_ms / 2);
              // this.current_interval_ms +=  (- diff_ms / 4)
            }
          } else {
            await delay(this.min_interval_ms);
          }
        }
      })();
    })();
  }

  setFunc(func) {
    this.func = func;
  }

  stop() {
    this.flag = false;
  }

  start() {
    this.flag = true;
  }

  release() {
    this.running = false;
  }
}

export default InstantThread;
// this.runCount = 0;
// this.latencyList = [];
//
// latency = execute_ms;
//
// if(this.runCount > 29){
//     const averageLatency = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
//     latency_avg = averageLatency(this.latencyList);
//     latency_max = Math.max.apply(null, this.latencyList);
//     latency_min = Math.min.apply(null, this.latencyList);
//     FPS =  Math.floor(1000 / averageLatency(this.latencyList));
//     this.latencyList = [];
//     this.runCount = 0;
// }
