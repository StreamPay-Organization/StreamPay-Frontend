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
 * Describe a unix-ms timestamp relative to now, e.g. "in 3d 4h" or "2h ago".
 * @param {number} ts
 * @param {number} [now]
 * @returns {string}
 */
export function formatRelative(ts, now = Date.now()) {
  if (!ts) return '—';
  const diff = ts - now;
  const label = formatDuration(Math.abs(diff));
  return diff >= 0 ? `in ${label}` : `${label} ago`;
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

/**
 * Abbreviate large numbers with a K/M/B suffix, e.g. 12500 → "12.5K".
 * Numbers below 1000 are returned with up to one decimal place.
 * @param {number} value
 * @returns {string}
 */
export function abbreviateNumber(value) {
  if (value == null || Number.isNaN(value)) return '0';
  const abs = Math.abs(value);
  const units = [
    { limit: 1e9, suffix: 'B' },
    { limit: 1e6, suffix: 'M' },
    { limit: 1e3, suffix: 'K' },
  ];
  for (const { limit, suffix } of units) {
    if (abs >= limit) {
      const scaled = value / limit;
      return `${Number(scaled.toFixed(1))}${suffix}`;
    }
  }
  return `${Number(value.toFixed(1))}`;
}

/**
 * Format a streaming rate as an amount-per-unit label, e.g. "12.5 USDC/day".
 * @param {number} amount - amount per period
 * @param {string} token - token code
 * @param {string} [unit] - the period label (day, hr, …)
 * @returns {string}
 */
export function formatRate(amount, token, unit = 'day') {
  return `${formatToken(amount, token)}/${unit}`;
}
