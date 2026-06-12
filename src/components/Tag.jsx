import './Tag.css';

/**
 * Small label chip, optionally tinted with an arbitrary accent color and
 * optionally removable via a close button.
 * @param {object} props
 * @param {React.ReactNode} props.children - the tag text
 * @param {string} [props.color] - accent color (e.g. a token color)
 * @param {() => void} [props.onRemove] - when set, render a remove button
 */
export default function Tag({ children, color, onRemove }) {
  const style = color
    ? { color, borderColor: color, background: `${color}1f` }
    : undefined;

  return (
    <span className="tag" style={style}>
      <span className="tag__label">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="tag__remove"
          onClick={onRemove}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
