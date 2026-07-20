import { clamp } from '../utils/time.js';
import { formatPercent } from '../utils/format.js';
import { DEFAULT_TOKEN_COLOR } from '../constants/tokens.js';
import './ProgressRing.css';

/**
 * Circular progress indicator drawn with SVG, suitable for compact stream
 * completion display. Exposed as an ARIA progressbar.
 * @param {object} props
 * @param {number} props.fraction - completion in 0..1
 * @param {number} [props.size] - diameter in pixels
 * @param {number} [props.stroke] - ring thickness in pixels
 * @param {string} [props.color] - accent color of the filled arc
 * @param {boolean} [props.showLabel] - render the percent in the center
 */
export default function ProgressRing({
  fraction,
  size = 64,
  stroke = 6,
  color = DEFAULT_TOKEN_COLOR,
  showLabel = true,
}) {
  const value = clamp(fraction, 0, 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  const percent = Math.round(value * 100);

  return (
    <div
      className="progress-ring"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} role="img" aria-label="Progress ring">
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <span className="progress-ring__label">{formatPercent(value)}</span>
      )}
    </div>
  );
}
