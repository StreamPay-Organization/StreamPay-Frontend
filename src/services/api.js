/**
 * Tiny mock "network" layer.
 * Simulates async calls with latency and an occasional failure so the UI
 * can exercise loading and error states. No real network is used.
 */

const DEFAULT_LATENCY = 600;

/**
 * Create a DOMException-like AbortError.
 * Uses the native DOMException when available, otherwise falls back to an
 * Error with `name === 'AbortError'` so callers can reliably detect aborts.
 * @param {string} [message]
 * @returns {Error}
 */
export function createAbortError(message = 'The operation was aborted.') {
  if (typeof DOMException === 'function') {
    return new DOMException(message, 'AbortError');
  }
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

/**
 * Returns true when the given value is an abort error.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAbortError(error) {
  return Boolean(error && typeof error === 'object' && error.name === 'AbortError');
}

/**
 * Resolve a value after a simulated network delay.
 * If an AbortSignal is provided and becomes aborted (before or during the
 * delay), the promise rejects with an AbortError instead of resolving.
 * @template T
 * @param {T} value
 * @param {number} [latency] - delay in ms
 * @param {AbortSignal} [signal] - optional signal to cancel the request
 * @returns {Promise<T>}
 */
export function withLatency(value, latency = DEFAULT_LATENCY, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(createAbortError());
      return;
    }

    let timer = null;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (signal && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      }
    };

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    timer = setTimeout(() => {
      cleanup();
      resolve(value);
    }, latency);

    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Reject with an error after a simulated delay.
 * If an AbortSignal is provided and becomes aborted, the promise rejects with
 * an AbortError instead of the supplied message.
 * @param {string} message
 * @param {number} [latency]
 * @param {AbortSignal} [signal]
 * @returns {Promise<never>}
 */
export function failWithLatency(message, latency = DEFAULT_LATENCY, signal) {
  return new Promise((_, reject) => {
    if (signal && signal.aborted) {
      reject(createAbortError());
      return;
    }

    let timer = null;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (signal && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      }
    };

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(message));
    }, latency);

    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Create an abortable latency promise that resolves with the result of
 * `producer` after `latency` ms. If the signal aborts before completion the
 * promise rejects with an AbortError. `producer` may be a value or a function
 * returning a value (evaluated lazily at resolution time).
 * @template T
 * @param {T | (() => T)} producer
 * @param {number} [latency]
 * @param {AbortSignal} [signal]
 * @returns {Promise<T>}
 */
export function abortableLatency(producer, latency = DEFAULT_LATENCY, signal) {
  return withLatency(undefined, latency, signal).then(() =>
    typeof producer === 'function' ? producer() : producer,
  );
}

/**
 * Randomly fail roughly `rate` of the time to mimic flaky networks.
 * @param {number} [rate] - failure probability 0..1
 * @returns {boolean}
 */
export function maybeFail(rate = 0) {
  return Math.random() < rate;
}