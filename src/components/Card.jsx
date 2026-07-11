import './Card.css';

/**
 * Generic surface container with optional header and footer regions.
 * Wraps arbitrary content in the app's panel styling.
 * @param {object} props
 * @param {React.ReactNode} [props.title] - header heading
 * @param {React.ReactNode} [props.actions] - header-right content
 * @param {React.ReactNode} [props.footer] - footer content
 * @param {boolean} [props.padded] - apply inner padding to the body
 * @param {string} [props.className] - extra class names
 * @param {React.ReactNode} props.children - body content
 */
export default function Card({
  title,
  actions,
  footer,
  padded = true,
  className = '',
  children,
}) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <header className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'card__body' : 'card__body card__body--flush'}>
        {children}
      </div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  );
}
