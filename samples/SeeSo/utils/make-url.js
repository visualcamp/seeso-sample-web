/** @private */
const makeUrl_ = (useSimd, useThreads) => {
  if (!useThreads) {
    return [null, null];
  }
  var default_url = 'https://cdn.seeso.io/';
  if (useSimd) {
    default_url += 'simd/';
  } else {
    default_url += 'non-simd/';
  }
  return [default_url + 'seeso.js', default_url + 'seeso.worker.js'];
}
export default makeUrl_
