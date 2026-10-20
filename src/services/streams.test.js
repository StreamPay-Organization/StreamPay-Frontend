import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  encodeCursor,
  decodeCursor,
  compareStreams,
  sortStreams,
  applyFilters,
  filterMatchesCursor,
  fetchStreamHistoryPage,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
} from './streams';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStream(overrides = {}) {
  const id = overrides.id ?? 'stream-1';
  return {
    id,
    name: overrides.name ?? `Stream ${id}`,
    status: overrides.status ?? 'active',
    createdAt: overrides.createdAt ?? '2024-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00.000Z',
    owner: overrides.owner ?? 'alice',
    ...overrides,
  };
}

function makeStreams(count, startIndex = 0) {
  const streams = [];
  for (let i = 0; i < count; i += 1) {
    const n = startIndex + i;
    streams.push(
      makeStream({
        id: `stream-${String(n).padStart(5, '0')}`,
        name: `Stream ${n}`,
        status: n % 3 === 0 ? 'active' : n % 3 === 1 ? 'paused' : 'ended',
        createdAt: new Date(Date.UTC(2024, 0, 1, 0, 0, n)).toISOString(),
        updatedAt: new Date(Date.UTC(2024, 0, 1, 0, 0, n)).toISOString(),
        owner: n % 2 === 0 ? 'alice' : 'bob',
      }),
    );
  }
  return streams;
}

// Simulates a backend that supports cursor pagination over a mutable dataset.
function createFakeBackend(initialStreams) {
  let streams = [...initialStreams];
  const requests = [];

  function query({ cursor, limit, filters, signal }) {
    requests.push({ cursor, limit, filters, signal });
    if (signal?.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }
    const decoded = cursor ? decodeCursor(cursor) : null;
    const filtered = applyFilters(streams, filters);
    const sorted = sortStreams(filtered);
    let start = 0;
    if (decoded) {
      // Find first item strictly after the cursor position.
      start = sorted.findIndex((s) => compareStreams(s, decoded.last) > 0);
      if (start === -1) start = sorted.length;
    }
    const page = sorted.slice(start, start + limit);
    const nextCursor =
      page.length === limit && start + limit < sorted.length
        ? encodeCursor({ last: page[page.length - 1], filters })
        : null;
    return { items: page, nextCursor };
  }

  return {
    query,
    requests,
    insert(stream) {
      streams = [...streams, stream];
    },
    get streams() {
      return streams;
    },
  };
}

// ---------------------------------------------------------------------------
// Cursor encoding / decoding
// ---------------------------------------------------------------------------

describe('cursor encoding and decoding', () => {
  it('round-trips a cursor with sort key and filters', () => {
    const last = makeStream({ id: 'stream-42', createdAt: '2024-05-01T00:00:00.000Z' });
    const filters = { status: 'active', owner: 'alice' };
    const cursor = encodeCursor({ last, filters });
    expect(typeof cursor).toBe('string');
    const decoded = decodeCursor(cursor);
    expect(decoded.last.id).toBe('stream-42');
    expect(decoded.last.createdAt).toBe('2024-05-01T00:00:00.000Z');
    expect(decoded.filters).toEqual(filters);
  });

  it('produces URL-safe cursors', () => {
    const cursor = encodeCursor({
      last: makeStream({ id: 'stream/with+special=chars' }),
      filters: { status: 'active' },
    });
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects malformed cursors', () => {
    expect(() => decodeCursor('not-a-valid-cursor')).toThrow();
    expect(() => decodeCursor('')).toThrow();
    expect(() => decodeCursor(undefined)).toThrow();
  });

  it('rejects cursors missing required fields', () => {
    const bad = Buffer.from(JSON.stringify({ filters: {} })).toString('base64url');
    expect(() => decodeCursor(bad)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stable sort
// ---------------------------------------------------------------------------

describe('stable sort', () => {
  it('orders by createdAt descending then id descending', () => {
    const a = makeStream({ id: 'a', createdAt: '2024-01-01T00:00:00.000Z' });
    const b = makeStream({ id: 'b', createdAt: '2024-01-02T00:00:00.000Z' });
    const c = makeStream({ id: 'c', createdAt: '2024-01-02T00:00:00.000Z' });
    const sorted = sortStreams([a, b, c]);
    expect(sorted.map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });

  it('is deterministic across shuffles', () => {
    const streams = makeStreams(50);
    const shuffled = [...streams].sort(() => Math.random() - 0.5);
    const s1 = sortStreams(shuffled).map((s) => s.id);
    const s2 = sortStreams([...shuffled].reverse()).map((s) => s.id);
    expect(s1).toEqual(s2);
  });

  it('compareStreams is a total order', () => {
    const a = makeStream({ id: 'a', createdAt: '2024-01-01T00:00:00.000Z' });
    const b = makeStream({ id: 'b', createdAt: '2024-01-01T00:00:00.000Z' });
    expect(compareStreams(a, a)).toBe(0);
    expect(compareStreams(a, b)).toBeGreaterThan(0);
    expect(compareStreams(b, a)).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// Filter contract
// ---------------------------------------------------------------------------

describe('filter contract', () => {
  it('filters by status and owner', () => {
    const streams = makeStreams(30);
    const filtered = applyFilters(streams, { status: 'active', owner: 'alice' });
    expect(filtered.length).toBeGreaterThan(0);
    for (const s of filtered) {
      expect(s.status).toBe('active');
      expect(s.owner).toBe('alice');
    }
  });

  it('returns all streams when filters are empty', () => {
    const streams = makeStreams(10);
    expect(applyFilters(streams, {})).toHaveLength(10);
    expect(applyFilters(streams, undefined)).toHaveLength(10);
  });

  it('embeds filters in the cursor and rejects mismatched filters', () => {
    const cursor = encodeCursor({
      last: makeStream({ id: 'stream-1' }),
      filters: { status: 'active' },
    });
    const decoded = decodeCursor(cursor);
    expect(filterMatchesCursor(decoded, { status: 'active' })).toBe(true);
    expect(filterMatchesCursor(decoded, { status: 'paused' })).toBe(false);
    expect(filterMatchesCursor(decoded, { status: 'active', owner: 'alice' })).toBe(false);
  });

  it('treats filter key order as insignificant', () => {
    const cursor = encodeCursor({
      last: makeStream({ id: 'stream-1' }),
      filters: { status: 'active', owner: 'alice' },
    });
    const decoded = decodeCursor(cursor);
    expect(filterMatchesCursor(decoded, { owner: 'alice', status: 'active' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pagination races with concurrent inserts
// ---------------------------------------------------------------------------

describe('pagination under concurrent inserts', () => {
  it('produces no duplicates or gaps when new streams arrive between pages', async () => {
    const initial = makeStreams(25);
    const backend = createFakeBackend(initial);
    const seen = [];
    let cursor = null;
    let pageCount = 0;

    do {
      const page = await fetchStreamHistoryPage({
        cursor,
        limit: 10,
        filters: {},
        fetcher: (args) => backend.query(args),
      });
      seen.push(...page.items.map((s) => s.id));
      cursor = page.nextCursor;
      pageCount += 1;

      // Insert new streams between pages (some newer, some older).
      if (pageCount === 1) {
        backend.insert(
          makeStream({
            id: 'stream-newer',
            createdAt: '2024-12-31T00:00:00.000Z',
          }),
        );
        backend.insert(
          makeStream({
            id: 'stream-older',
            createdAt: '2023-01-01T00:00:00.000Z',
          }),
        );
      }
    } while (cursor && pageCount < 100);

    const unique = new Set(seen);
    expect(unique.size).toBe(seen.length);
    // Every originally-present stream must appear exactly once.
    for (const s of initial) {
      expect(seen.filter((id) => id === s.id)).toHaveLength(1);
    }
  });

  it('does not skip records when inserts land before the cursor', async () => {
    const backend = createFakeBackend(makeStreams(20));
    const first = await fetchStreamHistoryPage({
      cursor: null,
      limit: 5,
      filters: {},
      fetcher: (args) => backend.query(args),
    });
    // Insert a stream that sorts before the cursor position.
    backend.insert(
      makeStream({ id: 'stream-inserted', createdAt: '2024-06-01T00:00:00.000Z' }),
    );
    const second = await fetchStreamHistoryPage({
      cursor: first.nextCursor,
      limit: 5,
      filters: {},
      fetcher: (args) => backend.query(args),
    });
    const firstIds = new Set(first.items.map((s) => s.id));
    for (const s of second.items) {
      expect(firstIds.has(s.id)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

describe('request cancellation', () => {
  it('aborts obsolete requests via AbortController', async () => {
    const backend = createFakeBackend(makeStreams(10));
    const controller = new AbortController();
    const promise = fetchStreamHistoryPage({
      cursor: null,
      limit: 5,
      filters: {},
      signal: controller.signal,
      fetcher: (args) => backend.query(args),
    });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('does not call the fetcher when the signal is already aborted', async () => {
    const fetcher = vi.fn();
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchStreamHistoryPage({
        cursor: null,
        limit: 5,
        filters: {},
        signal: controller.signal,
        fetcher,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('only the latest request resolves when superseded', async () => {
    const backend = createFakeBackend(makeStreams(10));
    const controller1 = new AbortController();
    const p1 = fetchStreamHistoryPage({
      cursor: null,
      limit: 5,
      filters: {},
      signal: controller1.signal,
      fetcher: (args) => backend.query(args),
    });
    controller1.abort();
    const p2 = fetchStreamHistoryPage({
      cursor: null,
      limit: 5,
      filters: {},
      fetcher: (args) => backend.query(args),
    });
    await expect(p1).rejects.toMatchObject({ name: 'AbortError' });
    const result = await p2;
    expect(result.items).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Bounded requests
// ---------------------------------------------------------------------------

describe('bounded page size', () => {
  it('caps requested limit at MAX_PAGE_SIZE', async () => {
    const backend = createFakeBackend(makeStreams(500));
    const page = await fetchStreamHistoryPage({
      cursor: null,
      limit: MAX_PAGE_SIZE * 10,
      filters: {},
      fetcher: (args) => backend.query(args),
    });
    expect(backend.requests[0].limit).toBe(MAX_PAGE_SIZE);
    expect(page.items.length).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });

  it('uses DEFAULT_PAGE_SIZE when limit is omitted', async () => {
    const backend = createFakeBackend(makeStreams(100));
    await fetchStreamHistoryPage({
      cursor: null,
      filters: {},
      fetcher: (args) => backend.query(args),
    });
    expect(backend.requests[0].limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('rejects non-positive limits', async () => {
    await expect(
      fetchStreamHistoryPage({
        cursor: null,
        limit: 0,
        filters: {},
        fetcher: vi.fn(),
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Large fixture performance
// ---------------------------------------------------------------------------

describe('large fixture performance', () => {
  it('paginates 1000 streams within a reasonable time', async () => {
    const backend = createFakeBackend(makeStreams(1000));
    const seen = new Set();
    let cursor = null;
    let pages = 0;
    const start = Date.now();
    do {
      const page = await fetchStreamHistoryPage({
        cursor,
        limit: 100,
        filters: {},
        fetcher: (args) => backend.query(args),
      });
      for (const s of page.items) {
        expect(seen.has(s.id)).toBe(false);
        seen.add(s.id);
      }
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor && pages < 100);
    const elapsed = Date.now() - start;
    expect(seen.size).toBe(1000);
    expect(pages).toBe(10);
    expect(elapsed).toBeLessThan(2000);
  });

  it('sorts 1000 streams quickly', () => {
    const streams = makeStreams(1000);
    const start = Date.now();
    const sorted = sortStreams(streams);
    const elapsed = Date.now() - start;
    expect(sorted).toHaveLength(1000);
    expect(elapsed).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Regression: original offset-based duplicate/omission failure mode
// ---------------------------------------------------------------------------

describe('regression: offset pagination duplicates/omissions', () => {
  // Reproduces the original failure: offset-based pagination over a dataset
  // that receives inserts between page fetches yields duplicates or gaps.
  function offsetFetch(streams, offset, limit) {
    const sorted = sortStreams(streams);
    return sorted.slice(offset, offset + limit);
  }

  it('demonstrates offset pagination duplicates when a record is inserted before the offset', () => {
    const streams = makeStreams(10);
    const page1 = offsetFetch(streams, 0, 5);
    // Insert a newer stream that sorts to the front.
    const withInsert = [
      ...streams,
      makeStream({ id: 'stream-inserted', createdAt: '2024-12-31T00:00:00.000Z' }),
    ];
    const page2 = offsetFetch(withInsert, 5, 5);
    const combined = [...page1, ...page2].map((s) => s.id);
    const unique = new Set(combined);
    // Offset pagination produces a duplicate here.
    expect(unique.size).toBeLessThan(combined.length);
  });

  it('cursor pagination avoids the duplicate/omission failure mode', async () => {
    const backend = createFakeBackend(makeStreams(10));
    const seen = [];
    let cursor = null;
    let pages = 0;
    do {
      const page = await fetchStreamHistoryPage({
        cursor,
        limit: 5,
        filters: {},
        fetcher: (args) => backend.query(args),
      });
      seen.push(...page.items.map((s) => s.id));
      cursor = page.nextCursor;
      pages += 1;
      if (pages === 1) {
        backend.insert(
          makeStream({ id: 'stream-inserted', createdAt: '2024-12-31T00:00:00.000Z' }),
        );
      }
    } while (cursor && pages < 50);

    const unique = new Set(seen);
    expect(unique.size).toBe(seen.length);
    // All original records present exactly once.
    for (let i = 0; i < 10; i += 1) {
      const id = `stream-${String(i).padStart(5, '0')}`;
      expect(seen.filter((s) => s === id)).toHaveLength(1);
    }
  });
});