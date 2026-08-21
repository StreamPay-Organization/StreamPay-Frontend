/**
 * Tiny mock "network" layer.
 * Simulates async calls with latency and an occasional failure so the UI
 * can exercise loading and error states. No real network is used.
 */

const DEFAULT_LATENCY = 600;

/**
 * Resolve a value after a simulated network delay.
 * If `signal` is provided and already aborted, rejects immediately with an
 * AbortError.  If the signal fires during the delay, the promise rejects and
 * the pending timeout is cleared to avoid memory leaks.
 *
 * @template T
 * @param {T} value
 * @param {number} [latency] - delay in ms
 * @param {AbortSignal} [signal] - optional cancellation signal
 * @returns {Promise<T>}
 */
export function withLatency(value, latency = DEFAULT_LATENCY, signal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
      } else {
        resolve(value);
      }
    }, latency);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(id);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Reject with an error after a simulated delay.
 * @param {string} message
 * @param {number} [latency]
 * @returns {Promise<never>}
 */
export function failWithLatency(message, latency = DEFAULT_LATENCY) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), latency);
  });
}

/**
 * Randomly fail roughly `rate` of the time to mimic flaky networks.
 * @param {number} [rate] - failure probability 0..1
 * @returns {boolean}
 */
export function maybeFail(rate = 0) {
  return Math.random() < rate;
}
