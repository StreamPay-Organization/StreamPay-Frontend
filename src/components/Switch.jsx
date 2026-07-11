import './Switch.css';

/**
 * Accessible on/off toggle built on a checkbox input, styled as a sliding
 * switch. The visual track is decorative; the real input drives state.
 * @param {object} props
 * @param {boolean} props.checked - current state
 * @param {(checked: boolean) => void} props.onChange - state change handler
 * @param {string} [props.label] - visible label text
 * @param {boolean} [props.disabled]
 */
export default function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`switch${disabled ? ' switch--disabled' : ''}`}>
      <input
        type="checkbox"
        className="switch__input sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      {label && <span className="switch__label">{label}</span>}
    </label>
  );
}
