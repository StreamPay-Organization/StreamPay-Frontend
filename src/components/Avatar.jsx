import { isValidAddress } from '../utils/validate.js';
import { hashCode, mulberry32 } from '../utils/identicon.js';
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
 * Round avatar showing either an identicon (for Stellar addresses) or the first
 * character of a seed on a stable background color. Purely decorative.
 * @param {object} props
 * @param {string} props.seed - address or name used to derive the avatar
 * @param {number} [props.size] - diameter in pixels
 */
export default function Avatar({ seed = '', size = 32 }) {
  const cleanSeed = seed.trim();
  const isAddress = isValidAddress(cleanSeed);

  if (isAddress) {
    const prng = mulberry32(hashCode(cleanSeed));

    // Generate stable vibrant color for the identicon elements
    const hue = Math.floor(prng() * 360);
    const saturation = 65 + Math.floor(prng() * 20); // 65% - 85%
    const lightness = 40 + Math.floor(prng() * 15); // 40% - 55%
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // Generate a symmetric 5x5 grid of blocks
    const rects = [];
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const fill = prng() < 0.5;
        if (fill) {
          rects.push(
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill={color}
            />
          );
          if (c < 2) {
            rects.push(
              <rect
                key={`${r}-${4 - c}`}
                x={4 - c}
                y={r}
                width={1}
                height={1}
                fill={color}
              />
            );
          }
        }
      }
    }

    return (
      <svg
        className="avatar avatar--identicon"
        viewBox="0 0 5 5"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {rects}
      </svg>
    );
  }

  const initial = (cleanSeed[0] || '?').toUpperCase();
  const style = {
    width: size,
    height: size,
    background: colorFor(cleanSeed),
    fontSize: size * 0.45,
  };
  return (
    <span className="avatar avatar--text" style={style} aria-hidden="true">
      {initial}
    </span>
  );
}
