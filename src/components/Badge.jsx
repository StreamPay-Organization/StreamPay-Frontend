import './Badge.css';

/**
 * Small colored pill, typically used for stream status.
 * @param {{tone?: 'neutral'|'success'|'danger'|'info', children: React.ReactNode}} props
 */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

/**
 * Map a stream status to a badge tone.
 * @param {string} status
 * @returns {'neutral'|'success'|'danger'|'info'}
 */
export function statusTone(status) {
  if (status === 'active') return 'success';
  if (status === 'cancelled') return 'danger';
  if (status === 'completed') return 'info';
  return 'neutral';
}
