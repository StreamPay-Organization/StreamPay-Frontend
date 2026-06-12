/**
 * Tiny mock "network" layer.
 * Simulates async calls with latency and an occasional failure so the UI
 * can exercise loading and error states. No real network is used.
 */

const DEFAULT_LATENCY = 600;

/**
 * Resolve a value after a simulated network delay.
 * @template T
 * @param {T} value
 * @param {number} [latency] - delay in ms
 * @returns {Promise<T>}
 */
export function withLatency(value, latency = DEFAULT_LATENCY) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), latency);
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
