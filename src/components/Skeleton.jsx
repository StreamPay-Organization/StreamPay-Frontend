import './Skeleton.css';

/**
 * Shimmering placeholder block shown while content loads.
 * @param {{width?: string, height?: string, radius?: string,
 *   className?: string}} props
 */
export default function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-sm)',
  className = '',
}) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
