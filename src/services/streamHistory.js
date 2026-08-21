/**
 * Stream history service.
 *
 * Provides cursor/snapshot pagination over stream events so that concurrent
 * inserts cannot produce duplicate rows or gaps in a paginated result set.
 *
 * Design decisions:
 *  - Snapshot pagination: the full filtered+sorted event list is captured once
 *    per query and stored by a snapshotId.  The cursor carries (snapshotId,
 *    offset) so subsequent pages always read from the same frozen slice.
 *  - Stable sort: (timestamp DESC, id ASC).  The secondary key on `id` makes
 *    the order deterministic when two events share a timestamp.
 *  - Filters (status, token, direction) are reflected inside the cursor — a
 *    filter change always creates a new snapshot.
 *  - Page size is capped at MAX_PAGE_SIZE (50) to keep responses bounded.
 *  - Every async helper accepts an AbortSignal.  It resolves immediately with
 *    an AbortError when the signal fires, preventing stale results from
 *    reaching component state.
 */

import { withLatency } from './api.js';

// ---------------------------------------------------------------------------
// Event store
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   id: string,
 *   streamId: string,
 *   type: 'created'|'withdrawn'|'cancelled'|'completed',
 *   timestamp: number,
 *   amount?: number,
 *   actor: string,
 *   token: string,
 *   direction: 'incoming'|'outgoing',
 *   status: string,
 * }} StreamEvent
 */

/** Incrementing counter for synthetic event ids. */
let nextEventId = 1;

/** @type {StreamEvent[]} */
let events = [];

/**
 * Replace the entire event store (used in tests).
 * @param {StreamEvent[]} replacement
 */
export function _setEvents(replacement) {
  events = replacement.slice();
  snapshots.clear();
}

/**
 * Append a single event to the store (called by streams.js mutations).
 * @param {Omit<StreamEvent, 'id'>} partial
 * @returns {StreamEvent}
 */
export function appendEvent(partial) {
  const ev = { id: `ev-${nextEventId++}`, ...partial };
  events = [ev, ...events];
  return ev;
}

// ---------------------------------------------------------------------------
// Snapshot store
// ---------------------------------------------------------------------------

/** @type {Map<string, StreamEvent[]>} */
const snapshots = new Map();

let nextSnapshotId = 1;

/**
 * Evict snapshots beyond the LRU cap to avoid unbounded memory growth.
 * Keeps the 20 most recent snapshots.
 */
const SNAPSHOT_CAP = 20;
function evictOldSnapshots() {
  if (snapshots.size > SNAPSHOT_CAP) {
    const oldest = [...snapshots.keys()].slice(0, snapshots.size - SNAPSHOT_CAP);
    for (const k of oldest) snapshots.delete(k);
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Filter & sort helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   status?: string,
 *   token?: string,
 *   direction?: 'incoming'|'outgoing',
 * }} HistoryFilters
 */

/**
 * Apply filters to a list of events.
 * @param {StreamEvent[]} evs
 * @param {HistoryFilters} filters
 * @returns {StreamEvent[]}
 */
function applyFilters(evs, filters) {
  return evs.filter((ev) => {
    if (filters.status && ev.status !== filters.status) return false;
    if (filters.token && ev.token !== filters.token) return false;
    if (filters.direction && ev.direction !== filters.direction) return false;
    return true;
  });
}

/**
 * Stable sort: timestamp DESC, then id ASC (lexicographic) to break ties.
 * Returns a new array — never mutates.
 * @param {StreamEvent[]} evs
 * @returns {StreamEvent[]}
 */
export function stableSort(evs) {
  return [...evs].sort((a, b) => {
    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

// ---------------------------------------------------------------------------
// Cursor type
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   snapshotId: string,
 *   offset: number,
 *   filters: HistoryFilters,
 * }} HistoryCursor
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the first page of stream history.
 *
 * Builds a snapshot from the current event store, applies filters and stable
 * sort, then returns up to `pageSize` items together with a cursor that can be
 * passed to {@link fetchHistoryPage} to retrieve subsequent pages.
 *
 * @param {{
 *   filters?: HistoryFilters,
 *   pageSize?: number,
 *   signal?: AbortSignal,
 * }} opts
 * @returns {Promise<{
 *   items: StreamEvent[],
 *   cursor: HistoryCursor | null,
 *   total: number,
 *   hasMore: boolean,
 * }>}
 */
export async function fetchHistoryFirstPage(opts = {}) {
  const { filters = {}, pageSize: rawSize = DEFAULT_PAGE_SIZE, signal } = opts;
  const pageSize = Math.min(Math.max(1, rawSize), MAX_PAGE_SIZE);

  // Build & freeze the snapshot.
  const sorted = stableSort(applyFilters(events, filters));
  const snapshotId = `snap-${nextSnapshotId++}`;
  snapshots.set(snapshotId, sorted);
  evictOldSnapshots();

  const items = sorted.slice(0, pageSize);
  const offset = items.length;
  const hasMore = offset < sorted.length;
  const cursor = hasMore ? { snapshotId, offset, filters } : null;

  return withLatency({ items, cursor, total: sorted.length, hasMore }, 0, signal);
}

/**
 * Fetch the next page given a cursor returned by a previous call.
 * Returns the same shape as {@link fetchHistoryFirstPage}.
 *
 * If the snapshot referenced by the cursor has been evicted (which only
 * happens after 20 newer snapshots have been created), the call rejects with
 * an error asking the caller to restart from the first page.
 *
 * @param {{
 *   cursor: HistoryCursor,
 *   pageSize?: number,
 *   signal?: AbortSignal,
 * }} opts
 */
export async function fetchHistoryPage(opts) {
  const { cursor, pageSize: rawSize = DEFAULT_PAGE_SIZE, signal } = opts;
  const pageSize = Math.min(Math.max(1, rawSize), MAX_PAGE_SIZE);

  const snapshot = snapshots.get(cursor.snapshotId);
  if (!snapshot) {
    throw new Error(
      'Snapshot expired. Please reload from the first page.'
    );
  }

  const items = snapshot.slice(cursor.offset, cursor.offset + pageSize);
  const nextOffset = cursor.offset + items.length;
  const hasMore = nextOffset < snapshot.length;
  const nextCursor = hasMore
    ? { snapshotId: cursor.snapshotId, offset: nextOffset, filters: cursor.filters }
    : null;

  return withLatency(
    {
      items,
      cursor: nextCursor,
      total: snapshot.length,
      hasMore,
    },
    0,
    signal
  );
}
