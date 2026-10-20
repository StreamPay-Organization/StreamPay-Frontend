import { DAY, elapsedFraction } from './time.js';

/**
 * Derived, view-friendly values for a stream at a given moment.
 * @param {object} stream
 * @param {string} me - the current account address
 * @param {number} [now]
 * @returns {{outgoing:boolean, counterparty:string, fraction:number,
 *   streamed:number, claimable:number, remaining:number}}
 */
export function deriveStream(stream, me, now = Date.now()) {
  const outgoing = stream.sender === me;
  const counterparty = outgoing ? stream.recipient : stream.sender;
  const fraction = elapsedFraction(stream.start, stream.end, now);
  const streamed = stream.total * fraction;
  const claimable = Math.max(0, streamed - stream.withdrawn);
  const remaining = Math.max(0, stream.total - streamed);
  return { outgoing, counterparty, fraction, streamed, claimable, remaining };
}

/**
 * Streaming rate per day for a total spread evenly across a time window.
 * Returns 0 when the window is empty or the total is not positive.
 * @param {number} total
 * @param {number} start - start time in ms
 * @param {number} end - end time in ms
 * @returns {number}
 */
export function ratePerDay(total, start, end) {
  if (!(total > 0) || end <= start) return 0;
  const days = (end - start) / DAY;
  return total / days;
}

/**
 * Sum the total value of a list of streams, grouped by token.
 * @param {object[]} streams
 * @returns {Record<string, number>}
 */
export function totalsByToken(streams) {
  return streams.reduce((acc, s) => {
    acc[s.token] = (acc[s.token] || 0) + s.total;
    return acc;
  }, {});
}

/**
 * Stable sort key used for cursor pagination. Streams are ordered by
 * `start` descending, then by `id` descending so ties are deterministic.
 * @param {object} stream
 * @returns {[number, string]}
 */
export function sortKey(stream) {
  return [stream.start, String(stream.id)];
}

/**
 * Compare two streams by the stable sort order (descending start, then id).
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareStreams(a, b) {
  if (a.start !== b.start) return b.start - a.start;
  const ai = String(a.id);
  const bi = String(b.id);
  if (ai === bi) return 0;
  return ai < bi ? 1 : -1;
}

/**
 * Encode a pagination cursor. The cursor captures the active filters, the
 * snapshot time (so inserts after the snapshot cannot shift pages), and the
 * last sort key of the page that produced it.
 * @param {{filters?:object, snapshot?:number, last?:object}} cursor
 * @returns {string}
 */
export function encodeCursor(cursor) {
  const payload = {
    f: cursor && cursor.filters ? cursor.filters : {},
    s: cursor && Number.isFinite(cursor.snapshot) ? cursor.snapshot : 0,
    l: cursor && cursor.last ? sortKey(cursor.last) : null,
  };
  return encodeURIComponent(JSON.stringify(payload));
}

/**
 * Decode a pagination cursor. Returns `null` when the cursor is missing or
 * malformed so callers can fall back to the first page.
 * @param {string} raw
 * @returns {{filters:object, snapshot:number, last:[number,string]|null}|null}
 */
export function decodeCursor(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  let parsed;
  try {
    parsed = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const filters = parsed.f && typeof parsed.f === 'object' ? parsed.f : {};
  const snapshot = Number.isFinite(parsed.s) ? parsed.s : 0;
  let last = null;
  if (Array.isArray(parsed.l) && parsed.l.length === 2) {
    const [start, id] = parsed.l;
    if (Number.isFinite(start) && typeof id === 'string') last = [start, id];
  }
  return { filters, snapshot, last };
}

/**
 * Validate that a decoded cursor is well-formed and consistent with the
 * filters currently applied. Returns `true` when the cursor can be used.
 * @param {object|null} cursor
 * @param {object} [filters]
 * @returns {boolean}
 */
export function isValidCursor(cursor, filters = {}) {
  if (!cursor || typeof cursor !== 'object') return false;
  if (!Number.isFinite(cursor.snapshot) || cursor.snapshot <= 0) return false;
  if (cursor.last !== null) {
    if (!Array.isArray(cursor.last) || cursor.last.length !== 2) return false;
    if (!Number.isFinite(cursor.last[0]) || typeof cursor.last[1] !== 'string') {
      return false;
    }
  }
  const cursorFilters = cursor.filters || {};
  const keys = new Set([...Object.keys(cursorFilters), ...Object.keys(filters || {})]);
  for (const key of keys) {
    if (cursorFilters[key] !== (filters || {})[key]) return false;
  }
  return true;
}

/**
 * Merge paginated pages into a single list, dropping duplicate ids and
 * preserving the stable sort order. Later pages never reorder earlier ones.
 * @param {object[]} existing
 * @param {object[]} incoming
 * @returns {object[]}
 */
export function mergePages(existing, incoming) {
  const seen = new Set();
  const merged = [];
  for (const stream of [...(existing || []), ...(incoming || [])]) {
    if (!stream || stream.id == null) continue;
    const key = String(stream.id);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(stream);
  }
  return merged.sort(compareStreams);
}
