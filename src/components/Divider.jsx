import './Divider.css';

/**
 * Horizontal rule used to separate sections, optionally with centered label
 * text. Rendered as a semantic <hr> when no label is provided.
 * @param {object} props
 * @param {React.ReactNode} [props.children] - optional centered label
 * @param {'sm'|'md'|'lg'} [props.spacing] - vertical margin size
 */
export default function Divider({ children, spacing = 'md' }) {
  if (!children) {
    return <hr className={`divider divider--${spacing}`} />;
  }
  return (
    <div className={`divider divider--labeled divider--${spacing}`} role="separator">
      <span className="divider__line" aria-hidden="true" />
      <span className="divider__label">{children}</span>
      <span className="divider__line" aria-hidden="true" />
    </div>
  );
}
