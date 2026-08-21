import { useStreamHistory } from '../hooks/useStreamHistory.js';
import { TOKENS } from '../constants/tokens.js';
import { formatDate, formatToken } from '../utils/format.js';
import Loader from './Loader.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import EmptyState from './EmptyState.jsx';
import './StreamHistoryTable.css';

/** Map event type to a human-readable label. */
const EVENT_LABELS = {
  created: 'Created',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/** Map event type to a badge class for colour coding. */
const EVENT_BADGE_CLASS = {
  created: 'sht-badge--created',
  withdrawn: 'sht-badge--withdrawn',
  cancelled: 'sht-badge--cancelled',
  completed: 'sht-badge--completed',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DIRECTION_OPTIONS = [
  { value: '', label: 'All directions' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

/**
 * StreamHistoryTable
 *
 * Displays paginated stream events with filter controls for status, token, and
 * direction.  Pagination uses cursor/snapshot semantics — new events arriving
 * while the user browses pages do not cause duplicates or gaps.
 *
 * @param {{ pageSize?: number }} props
 */
export default function StreamHistoryTable({ pageSize = 20 }) {
  const {
    items,
    loading,
    error,
    total,
    hasMore,
    page,
    filters,
    setFilters,
    nextPage,
    prevPage,
    reload,
  } = useStreamHistory({ pageSize });

  function handleStatusChange(e) {
    const value = e.target.value;
    setFilters({ ...filters, status: value || undefined });
  }

  function handleTokenChange(e) {
    const value = e.target.value;
    setFilters({ ...filters, token: value || undefined });
  }

  function handleDirectionChange(e) {
    const value = e.target.value;
    setFilters({ ...filters, direction: value || undefined });
  }

  const hasPrev = page > 1;
  const tokenList = TOKENS ?? [];

  return (
    <section className="sht" aria-label="Stream history">
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="sht__filters" role="group" aria-label="Filter stream history">
        <label className="sht__filter-label" htmlFor="sht-status">
          Status
          <select
            id="sht-status"
            className="sht__select"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="sht__filter-label" htmlFor="sht-token">
          Token
          <select
            id="sht-token"
            className="sht__select"
            value={filters.token ?? ''}
            onChange={handleTokenChange}
          >
            <option value="">All tokens</option>
            {tokenList.map((t) => (
              <option key={t.code} value={t.code}>{t.code}</option>
            ))}
          </select>
        </label>

        <label className="sht__filter-label" htmlFor="sht-direction">
          Direction
          <select
            id="sht-direction"
            className="sht__select"
            value={filters.direction ?? ''}
            onChange={handleDirectionChange}
          >
            {DIRECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-busy={loading}
        className="sht__body"
      >
        {loading && <Loader label="Loading history…" />}

        {error && !loading && (
          <ErrorMessage message={error} onRetry={reload} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="📋"
            title="No events found"
            description="No stream events match your current filters."
          />
        )}

        {!loading && !error && items.length > 0 && (
          <table className="sht__table" aria-label="Stream event history">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Stream</th>
                <th scope="col">Token</th>
                <th scope="col">Amount</th>
                <th scope="col">Direction</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ev) => (
                <tr key={ev.id} className="sht__row">
                  <td>
                    <span
                      className={`sht-badge ${EVENT_BADGE_CLASS[ev.type] ?? ''}`}
                    >
                      {EVENT_LABELS[ev.type] ?? ev.type}
                    </span>
                  </td>
                  <td className="sht__stream-id">
                    <code>{ev.streamId}</code>
                  </td>
                  <td>{ev.token}</td>
                  <td>
                    {ev.amount != null
                      ? formatToken(ev.amount, ev.token)
                      : '—'}
                  </td>
                  <td className={`sht__dir sht__dir--${ev.direction}`}>
                    {ev.direction === 'incoming' ? '↓ In' : '↑ Out'}
                  </td>
                  <td className="sht__date">{formatDate(ev.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination controls ──────────────────────────────────────── */}
      <div className="sht__pagination" aria-label="Pagination">
        <button
          className="sht__page-btn"
          onClick={prevPage}
          disabled={!hasPrev || loading}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        <span className="sht__page-info" aria-live="polite" aria-atomic="true">
          {loading
            ? 'Loading…'
            : `Page ${page}${total > 0 ? ` · ${total} event${total !== 1 ? 's' : ''}` : ''}`}
        </span>

        <button
          className="sht__page-btn"
          onClick={nextPage}
          disabled={!hasMore || loading}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </section>
  );
}
