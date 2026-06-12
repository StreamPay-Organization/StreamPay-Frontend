import './Spinner.css';

/**
 * Minimal spinning indicator for inline loading states. When standalone,
 * it carries role="status" so assistive tech announces the busy state.
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.label] - accessible label
 * @param {boolean} [props.inline] - drop role/label when used inside a button
 */
export default function Spinner({ size = 'md', label = 'Loading', inline = false }) {
  return (
    <span
      className={`spinner spinner--${size}`}
      role={inline ? undefined : 'status'}
      aria-label={inline ? undefined : label}
      aria-hidden={inline ? 'true' : undefined}
    />
  );
}
