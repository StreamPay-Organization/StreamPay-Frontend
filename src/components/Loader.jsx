import './Loader.css';

/**
 * Simple spinner with an optional label.
 * @param {{label?: string}} props
 */
export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spinner" role="img" aria-label="Loading spinner" />
      <span className="loader__label">{label}</span>
    </div>
  );
}
