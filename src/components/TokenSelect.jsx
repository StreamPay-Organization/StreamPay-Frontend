import { TOKENS } from '../constants/tokens.js';
import './TokenSelect.css';

/**
 * Dropdown for picking a supported token.
 * @param {{value: string, onChange: Function, id?: string, className?: string}} props
 */
export default function TokenSelect({ value, onChange, id = 'token', className = '' }) {
  return (
    <select
      id={id}
      className={['token-select', className].filter(Boolean).join(' ')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {TOKENS.map((token) => (
        <option key={token.code} value={token.code}>
          {token.icon} {token.code} — {token.label}
        </option>
      ))}
    </select>
  );
}
