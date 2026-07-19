import './Chip.css';

/**
 * Selectable filter chip, typically used in a group to toggle a facet such as
 * a stream status or token. Reflects its state via aria-pressed.
 * @param {object} props
 * @param {React.ReactNode} props.children - chip label
 * @param {boolean} [props.selected] - whether the chip is active
 * @param {() => void} [props.onClick] - toggle handler
 * @param {string} [props.icon] - optional leading icon/emoji
 */
export default function Chip({ children, selected = false, onClick, icon }) {
  return (
    <button
      type="button"
      className={`chip${selected ? ' chip--selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {icon && (
        <span className="chip__icon" role="img" aria-label="Chip icon">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
