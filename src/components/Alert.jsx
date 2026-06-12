import './Alert.css';

const ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '⛔',
};

/**
 * Inline message banner used for tips, confirmations and warnings.
 * Uses role="alert" for danger/warning so screen readers announce them.
 * @param {object} props
 * @param {'info'|'success'|'warning'|'danger'} [props.tone]
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children - body content
 * @param {() => void} [props.onDismiss] - when set, render a close button
 */
export default function Alert({ tone = 'info', title, children, onDismiss }) {
  const assertive = tone === 'danger' || tone === 'warning';
  return (
    <div className={`alert alert--${tone}`} role={assertive ? 'alert' : 'status'}>
      <span className="alert__icon" aria-hidden="true">
        {ICONS[tone] || ICONS.info}
      </span>
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        <div className="alert__text">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert__close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
