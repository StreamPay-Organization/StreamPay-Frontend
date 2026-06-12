import './Avatar.css';

const PALETTE = ['#5b8cff', '#36d399', '#fbbd23', '#ff6b6b', '#a78bfa', '#2775ca'];

/**
 * Pick a stable palette color from an arbitrary seed string.
 * @param {string} seed
 * @returns {string}
 */
function colorFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/**
 * Round avatar showing the first character of an address or name on a stable,
 * seed-derived background color. Purely decorative for screen readers.
 * @param {object} props
 * @param {string} props.seed - address or name used to derive color + initial
 * @param {number} [props.size] - diameter in pixels
 */
export default function Avatar({ seed = '', size = 32 }) {
  const initial = (seed.trim()[0] || '?').toUpperCase();
  const style = {
    width: size,
    height: size,
    background: colorFor(seed),
    fontSize: size * 0.45,
  };
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initial}
    </span>
  );
}
