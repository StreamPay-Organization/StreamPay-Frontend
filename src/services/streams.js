import { withLatency } from './api.js';
import { DAY, HOUR, elapsedFraction } from '../utils/time.js';
import { appendEvent } from './streamHistory.js';

/**
 * Mock stream store. Keeps an in-memory list of payment streams and exposes
 * CRUD-ish operations that resolve asynchronously to imitate a backend.
 */

const ME = 'GCQYWQ3LSTREAMPAYDEMOACCOUNT00000000000000000000000000XQ';

let nextId = 100;

function seed() {
  const now = Date.now();
  return [
    {
      id: 'str-001',
      sender: 'GBSALARYEMPLOYERDEMOACCOUNT0000000000000000000000000ABCD',
      recipient: ME,
      token: 'USDC',
      total: 6000,
      withdrawn: 1200,
      start: now - 10 * DAY,
      end: now + 20 * DAY,
      status: 'active',
      label: 'Monthly salary',
    },
    {
      id: 'str-002',
      sender: 'GDGRANTDAOTREASURYDEMO000000000000000000000000000000WXYZ',
      recipient: ME,
      token: 'XLM',
      total: 1500,
      withdrawn: 0,
      start: now - 2 * DAY,
      end: now + 5 * DAY,
      status: 'active',
      label: 'Grant disbursement',
    },
    {
      id: 'str-003',
      sender: ME,
      recipient: 'GCCONTRACTORFREELANCERDEMO00000000000000000000000000LMNO',
      token: 'USDC',
      total: 2400,
      withdrawn: 800,
      start: now - 6 * HOUR,
      end: now + 30 * DAY,
      status: 'active',
      label: 'Contractor retainer',
    },
    {
      id: 'str-004',
      sender: ME,
      recipient: 'GDSUBSCRIPTIONSERVICEDEMO000000000000000000000000000PQRS',
      token: 'EURC',
      total: 120,
      withdrawn: 120,
      start: now - 40 * DAY,
      end: now - 10 * DAY,
      status: 'completed',
      label: 'SaaS subscription',
    },
  ];
}

let streams = seed();

/** @returns {string} the mock current account address */
export function currentAddress() {
  return ME;
}

// Emit seed events so the history table has data out of the box.
(function seedEvents() {
  const now = Date.now();
  for (const s of streams) {
    appendEvent({
      streamId: s.id,
      type: 'created',
      timestamp: s.start,
      actor: s.sender,
      token: s.token,
      direction: s.sender === ME ? 'outgoing' : 'incoming',
      status: s.status,
    });
    if (s.withdrawn > 0) {
      appendEvent({
        streamId: s.id,
        type: 'withdrawn',
        timestamp: s.start + Math.floor((s.end - s.start) * 0.3),
        amount: s.withdrawn,
        actor: s.recipient,
        token: s.token,
        direction: s.sender === ME ? 'outgoing' : 'incoming',
        status: s.status,
      });
    }
    if (s.status === 'completed') {
      appendEvent({
        streamId: s.id,
        type: 'completed',
        timestamp: s.end,
        actor: s.sender,
        token: s.token,
        direction: s.sender === ME ? 'outgoing' : 'incoming',
        status: s.status,
      });
    }
    if (s.status === 'cancelled') {
      appendEvent({
        streamId: s.id,
        type: 'cancelled',
        timestamp: now,
        actor: s.sender,
        token: s.token,
        direction: s.sender === ME ? 'outgoing' : 'incoming',
        status: s.status,
      });
    }
  }
})();

/**
 * Compute how much has streamed so far for a given stream at `now`.
 * @param {object} stream
 * @param {number} [now]
 * @returns {number}
 */
export function streamedSoFar(stream, now = Date.now()) {
  const fraction = elapsedFraction(stream.start, stream.end, now);
  return stream.total * fraction;
}

/**
 * List streams, optionally filtered by direction relative to the account.
 * @param {{direction?: 'incoming'|'outgoing'}} [opts]
 * @returns {Promise<object[]>}
 */
export async function listStreams(opts = {}) {
  let result = streams.slice();
  if (opts.direction === 'incoming') {
    result = result.filter((s) => s.recipient === ME);
  } else if (opts.direction === 'outgoing') {
    result = result.filter((s) => s.sender === ME);
  }
  return withLatency(result);
}

/**
 * Fetch a single stream by id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getStream(id) {
  const found = streams.find((s) => s.id === id) || null;
  return withLatency(found, 400);
}

/**
 * Create a new outgoing stream from the current account.
 * @param {object} input
 * @returns {Promise<object>}
 */
export async function createStream(input) {
  const stream = {
    id: `str-${nextId++}`,
    sender: ME,
    recipient: input.recipient.trim(),
    token: input.token,
    total: Number(input.total),
    withdrawn: 0,
    start: input.start,
    end: input.end,
    status: 'active',
    label: input.label || 'New stream',
  };
  streams = [stream, ...streams];
  appendEvent({
    streamId: stream.id,
    type: 'created',
    timestamp: Date.now(),
    actor: ME,
    token: stream.token,
    direction: 'outgoing',
    status: stream.status,
  });
  return withLatency(stream, 700);
}

/**
 * Withdraw the currently streamed (unclaimed) amount.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function withdrawStream(id) {
  const stream = streams.find((s) => s.id === id);
  if (!stream) throw new Error('Stream not found');
  const available = streamedSoFar(stream) - stream.withdrawn;
  stream.withdrawn += Math.max(0, available);
  appendEvent({
    streamId: stream.id,
    type: 'withdrawn',
    timestamp: Date.now(),
    amount: Math.max(0, available),
    actor: stream.recipient,
    token: stream.token,
    direction: stream.sender === ME ? 'outgoing' : 'incoming',
    status: stream.status,
  });
  return withLatency({ ...stream, claimed: available }, 700);
}

/**
 * Cancel a stream; sender reclaims the un-streamed remainder.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function cancelStream(id) {
  const stream = streams.find((s) => s.id === id);
  if (!stream) throw new Error('Stream not found');
  stream.status = 'cancelled';
  stream.end = Date.now();
  appendEvent({
    streamId: stream.id,
    type: 'cancelled',
    timestamp: Date.now(),
    actor: stream.sender,
    token: stream.token,
    direction: stream.sender === ME ? 'outgoing' : 'incoming',
    status: stream.status,
  });
  return withLatency({ ...stream }, 700);
}
