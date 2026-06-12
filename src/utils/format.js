import { DAY, HOUR, MINUTE } from './time.js';

/**
 * Format a token amount with a sensible number of decimals.
 * @param {number} amount
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatAmount(amount, decimals = 2) {
  if (amount == null || Number.isNaN(amount)) return '0';
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format an amount together with its token code.
 * @param {number} amount
 * @param {string} token
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatToken(amount, token, decimals = 2) {
  return `${formatAmount(amount, decimals)} ${token}`;
}

/**
 * Shorten a Stellar address for display (G...XXXX).
 * @param {string} address
 * @returns {string}
 */
export function shortAddress(address) {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Turn a millisecond duration into a compact human label like "3d 4h".
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms <= 0) return '0s';
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes && !days) parts.push(`${minutes}m`);
  return parts.slice(0, 2).join(' ') || '<1m';
}

/**
 * Format a unix-ms timestamp as a readable date-time.
 * @param {number} ts
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a fraction (0..1) as a percentage string.
 * @param {number} fraction
 * @returns {string}
 */
export function formatPercent(fraction) {
  return `${Math.round(fraction * 100)}%`;
}
