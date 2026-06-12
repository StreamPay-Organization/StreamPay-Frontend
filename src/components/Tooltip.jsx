import './Tooltip.css';

/**
 * Lightweight CSS tooltip that reveals a short hint on hover or focus.
 * The label is exposed to assistive tech via aria-label on the trigger.
 * @param {object} props
 * @param {string} props.label - the tooltip text
 * @param {'top'|'bottom'|'left'|'right'} [props.position]
 * @param {React.ReactNode} props.children - the trigger element/content
 */
export default function Tooltip({ label, position = 'top', children }) {
  if (!label) return children;
  return (
    <span
      className={`tooltip tooltip--${position}`}
      tabIndex={0}
      aria-label={label}
    >
      {children}
      <span className="tooltip__bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}
