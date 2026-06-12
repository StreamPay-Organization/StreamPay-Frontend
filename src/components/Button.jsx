import './Button.css';

/**
 * Reusable button with a few visual variants.
 * @param {object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'} [props.variant]
 * @param {boolean} [props.loading]
 */
export default function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
