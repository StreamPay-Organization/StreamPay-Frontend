/**
 * Tiny mock "network" layer.
 * Simulates async calls with latency and an occasional failure so the UI
 * can exercise loading and error states. No real network is used.
 */

const DEFAULT_LATENCY = 600;
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

function redactSecrets(value) {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value
      .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, '$1[REDACTED]')
      .replace(/(authorization\s*:\s*).*/gi, '$1[REDACTED]')
      .replace(/(sk_[A-Za-z0-9_]+)/gi, '[REDACTED]')
      .replace(/(token\s*[:=]\s*)([^\s,;]+)/gi, '$1[REDACTED]')
      .replace(/(secret\s*[:=]\s*)([^\s,;]+)/gi, '$1[REDACTED]');
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (/authorization|token|secret|password|api[_-]?key|cookie|bearer/i.test(key)) {
          return [key, '[REDACTED]'];
        }
        return [key, redactSecrets(item)];
      })
    );
  }

  return value;
}

function deriveStatus(input) {
  if (!input || typeof input !== 'object') return undefined;
  const status = input.status ?? input.statusCode ?? input.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function deriveCorrelationId(input) {
  if (!input || typeof input !== 'object') return undefined;

  const candidates = [
    input.correlationId,
    input.requestId,
    input.traceId,
    input.id,
    input.response?.headers?.['x-correlation-id'],
    input.response?.headers?.['X-Correlation-Id'],
    input.response?.headers?.['x-request-id'],
    input.response?.headers?.['X-Request-Id'],
    input.response?.data?.correlationId,
    input.response?.data?.requestId,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
}

export function isRetryableError(input) {
  const err = normalizeError(input);
  return Boolean(err.retryable);
}

export function normalizeError(input) {
  const raw = input && typeof input === 'object' && 'message' in input ? input : input;
  const messageValue =
    input && typeof input === 'object' && 'message' in input && typeof input.message === 'string'
      ? input.message
      : typeof input === 'string'
        ? input
        : '';

  const status = deriveStatus(raw);
  const correlationId = deriveCorrelationId(raw);
  const rawMessage = messageValue.trim();
  const lowerMessage = rawMessage.toLowerCase();

  let code = 'internal_error';
  let message = GENERIC_ERROR_MESSAGE;
  let retryable = false;

  if (status === 429) {
    code = 'rate_limited';
    message = 'Too many requests. Please wait a moment and try again.';
    retryable = true;
  } else if (status === 408 || status === 504 || status === 502 || status === 503) {
    code = 'upstream_unavailable';
    message = 'The service is temporarily unavailable. Please try again.';
    retryable = true;
  } else if (status === 400 || status === 422) {
    code = 'validation_error';
    message = 'Please check your details and try again.';
  } else if (status === 401 || status === 403) {
    code = 'unauthorized';
    message = 'You are not authorized to perform this action.';
  } else if (status === 404) {
    code = 'not_found';
    message = 'The requested resource was not found.';
  } else if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    code = 'request_timeout';
    message = 'The request timed out. Please try again.';
    retryable = true;
  } else if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection reset') ||
    lowerMessage.includes('econnreset') ||
    lowerMessage.includes('temporarily unavailable') ||
    lowerMessage.includes('service unavailable') ||
    lowerMessage.includes('too many requests')
  ) {
    code = 'upstream_unavailable';
    message = 'The service is temporarily unavailable. Please try again.';
    retryable = true;
  } else if (
    lowerMessage.includes('validation') ||
    lowerMessage.includes('invalid request') ||
    lowerMessage.includes('malformed') ||
    lowerMessage.includes('bad request') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('business rule')
  ) {
    code = 'validation_error';
    message = 'Please check your details and try again.';
  } else if (raw && typeof raw === 'object' && typeof raw.code === 'string') {
    const rawCode = raw.code.toLowerCase();
    if (rawCode.includes('timeout') || rawCode.includes('econn') || rawCode.includes('network')) {
      code = 'request_timeout';
      message = 'The request timed out. Please try again.';
      retryable = true;
    } else if (/429|rate[_ -]?limited|too many requests/i.test(rawCode)) {
      code = 'rate_limited';
      message = 'Too many requests. Please wait a moment and try again.';
      retryable = true;
    }
  }

  if (raw && typeof raw === 'object') {
    const responseData = raw.response?.data ?? raw.data;
    const responseMessage =
      (typeof responseData === 'string' && responseData.trim()) ||
      (responseData && typeof responseData === 'object' && typeof responseData.message === 'string' && responseData.message.trim()) ||
      '';

    const providerDescription = typeof raw.error === 'string' ? raw.error : responseMessage;
    if (providerDescription && /too many requests|rate limit|temporarily unavailable|timeout|econnreset|network/i.test(providerDescription.toLowerCase())) {
      retryable = true;
    }
  }

  const safeCause = redactSecrets(raw);

  return {
    code,
    message: message || GENERIC_ERROR_MESSAGE,
    retryable,
    correlationId,
    status,
    cause: safeCause,
  };
}

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
    setTimeout(() => reject(normalizeError(new Error(message))), latency);
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
