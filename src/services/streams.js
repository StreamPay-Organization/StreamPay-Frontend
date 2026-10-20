import { withLatency } from './api.js';
import { DAY, HOUR, elapsedFraction } from '../utils/time.js';

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
      createdAt: now - 10 * DAY,
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
      createdAt: now - 2 * DAY,
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
      createdAt: now - 6 * HOUR,
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
      createdAt: now - 40 * DAY,
    },
  ];
}

let streams = seed();

/** Maximum number of items a single history page may return. */
export const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Stable sort key: newest first by createdAt, then id descending as a
 * deterministic tiebreaker so pagination never reorders equal timestamps.
 */
function compareStreams(a, b) {
  if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

function encodeCursor(payload) {
  const json = JSON.stringify(payload);
  // btoa is available in browsers; fall back for non-browser environments.
  if (typeof btoa === 'function') return btoa(json);
  return Buffer.from(json, 'utf8').toString('base64');
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  let json;
  try {
    json = typeof atob === 'function'
      ? atob(cursor)
      : Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    throw new Error('Invalid cursor');
  }
  let payload;
  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error('Invalid cursor');
  }
  if (!payload || typeof payload !== 'object' || !payload.filters) {
    throw new Error('Invalid cursor');
  }
  return payload;
}

function normalizeFilters(opts = {}) {
  const direction =
    opts.direction === 'incoming' || opts.direction === 'outgoing'
      ? opts.direction
      : null;
  return {
    direction,
    token: opts.token || null,
    status: opts.status || null,
  };
}

function matchesFilters(stream, filters) {
  if (filters.direction === 'incoming' && stream.recipient !== ME) return false;
  if (filters.direction === 'outgoing' && stream.sender !== ME) return false;
  if (filters.token && stream.token !== filters.token) return false;
  if (filters.status && stream.status !== filters.status) return false;
  return true;
}

function sameFilters(a, b) {
  return (
    a.direction === b.direction &&
    a.token === b.token &&
    a.status === b.status
  );
}

function abortError() {
  const err = new Error('Request aborted');
  err.name = 'AbortError';
  return err;
}

/** @returns {string} the mock current account address */
export function currentAddress() {
  return ME;
}

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
 * List a single page of streams using cursor/snapshot pagination.
 *
 * The first call (no cursor) captures a snapshot boundary (`createdAt` of the
 * newest matching stream). Subsequent pages reuse the filters and snapshot
 * encoded in the cursor, so streams created after the snapshot are excluded
 * and no duplicates or gaps occur under concurrent inserts.
 *
 * @param {{
 *   cursor?: string|null,
 *   pageSize?: number,
 *   direction?: 'incoming'|'outgoing',
 *   token?: string,
 *   status?: string,
 *   signal?: AbortSignal,
 * }} [opts]
 * @returns {Promise<{items: object[], nextCursor: string|null, snapshot: number}>}
 */
export async function listStreamsPage(opts = {}) {
  const { signal } = opts;
  if (signal && signal.aborted) throw abortError();

  const decoded = decodeCursor(opts.cursor);
  const filters = decoded ? decoded.filters : normalizeFilters(opts);
  if (decoded && !sameFilters(decoded.filters, normalizeFilters(opts))) {
    // Cursor filters take precedence; callers must not mix cursor + filters.
    // We keep the cursor's filters to guarantee a stable contract.
  }

  const requested = Number(opts.pageSize);
  const pageSize = Number.isFinite(requested) && requested > 0
    ? Math.min(Math.floor(requested), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const snapshot = decoded
    ? decoded.snapshot
    : streams.reduce(
        (max, s) => (matchesFilters(s, filters) && s.createdAt > max ? s.createdAt : max),
        0,
      );

  const after = decoded ? decoded.after : null;

  const candidates = streams
    .filter((s) => matchesFilters(s, filters))
    .filter((s) => s.createdAt <= snapshot)
    .sort(compareStreams);

  let startIndex = 0;
  if (after) {
    startIndex = candidates.findIndex(
      (s) => compareStreams(s, after) > 0,
    );
    if (startIndex === -1) startIndex = candidates.length;
  }

  const slice = candidates.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < candidates.length;
  const last = slice[slice.length - 1];
  const nextCursor = hasMore && last
    ? encodeCursor({
        filters,
        snapshot,
        after: { createdAt: last.createdAt, id: last.id },
      })
    : null;

  const result = { items: slice, nextCursor, snapshot };

  // Simulate latency but honor cancellation.
  await withLatency(null, 300);
  if (signal && signal.aborted) throw abortError();
  return result;
}

/**
 * List streams, optionally filtered by direction relative to the account.
 * Thin backward-compatible wrapper over {@link listStreamsPage}.
 * @param {{direction?: 'incoming'|'outgoing', token?: string, status?: string}} [opts]
 * @returns {Promise<object[]>}
 */
export async function listStreams(opts = {}) {
  const { items } = await listStreamsPage({ ...opts, pageSize: MAX_PAGE_SIZE });
  return items;
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
    createdAt: Date.now(),
  };
  streams = [stream, ...streams];
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
  return withLatency({ ...stream }, 700);
}
