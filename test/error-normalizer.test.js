import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeError, isRetryableError } from '../src/services/api.js';

test('normalizes provider payload fixture and redacts secrets', () => {
  const raw = {
    code: 'ERR_BAD_RESPONSE',
    message: 'Provider rejected request',
    response: {
      status: 429,
      data: {
        message: 'Too many requests',
        token: 'sk_live_1234567890',
        details: 'provider payload contains raw secret material',
      },
    },
    requestId: 'trace-xyz-42',
    config: {
      headers: {
        Authorization: 'Bearer secret-token',
      },
    },
  };

  const err = normalizeError(raw);

  assert.equal(err.code, 'rate_limited');
  assert.equal(err.status, 429);
  assert.equal(err.retryable, true);
  assert.equal(err.correlationId, 'trace-xyz-42');
  assert.match(err.message, /too many requests|try again/i);
  assert.ok(!err.message.includes('sk_live_1234567890'));
  assert.ok(!err.message.includes('provider payload contains raw secret material'));
  assert.ok(!JSON.stringify(err.cause || {}).includes('sk_live_1234567890'));
  assert.ok(!JSON.stringify(err.cause || {}).includes('secret-token'));
});

test('classifies retryable and non-retryable errors using normalized metadata', () => {
  assert.equal(isRetryableError({ message: 'network timeout' }), true);
  assert.equal(isRetryableError({ status: 503 }), true);
  assert.equal(isRetryableError({ status: 422 }), false);
  assert.equal(isRetryableError({ status: 401 }), false);
  assert.equal(isRetryableError({ message: 'Stream not found' }), false);
});

test('extracts correlation ids from provider headers and error metadata', () => {
  const fromHeaders = normalizeError({
    response: {
      status: 503,
      headers: { 'x-correlation-id': 'corr-headers-1' },
    },
  });

  const fromMetadata = normalizeError({
    correlationId: 'corr-meta-2',
    status: 500,
  });

  assert.equal(fromHeaders.correlationId, 'corr-headers-1');
  assert.equal(fromMetadata.correlationId, 'corr-meta-2');
});

test('handles malformed error inputs safely', () => {
  const values = [null, undefined, 'boom', 42, { foo: 'bar' }, { message: '' }];

  for (const value of values) {
    const err = normalizeError(value);
    assert.equal(err.code, 'internal_error');
    assert.ok(typeof err.message === 'string');
    assert.ok(err.message.length > 0);
    assert.equal(err.retryable, false);
  }
});

test('unknown errors fail closed without exposing raw payloads', () => {
  const err = normalizeError({
    data: {
      secrets: ['sk_live_very_secret'],
      details: 'provider raw payload should never render',
    },
  });

  assert.equal(err.code, 'internal_error');
  assert.match(err.message, /something went wrong|try again/i);
  assert.ok(!err.message.includes('provider raw payload should never render'));
  assert.ok(!JSON.stringify(err.cause || {}).includes('sk_live_very_secret'));
});
