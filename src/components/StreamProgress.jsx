import { elapsedFraction } from '../utils/time.js';
import { formatPercent, formatToken } from '../utils/format.js';
import { tokenColor } from '../constants/tokens.js';
import { useNow } from '../hooks/useNow.js';
import './StreamProgress.css';

/**
 * Live progress bar + "streamed so far" counter for a stream.
 * Re-renders on an interval so the number ticks up in real time.
 * @param {{stream: object, interval?: number, showCounter?: boolean}} props
 */
export default function StreamProgress({
  stream,
  interval = 1000,
  showCounter = true,
}) {
  const now = useNow(interval, stream.status === 'active');
  const fraction = elapsedFraction(stream.start, stream.end, now);
  const streamed = stream.total * fraction;

  const percent = Math.round(fraction * 100);

  return (
    <div className="stream-progress">
      <div
        className="stream-progress__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${stream.label || 'Stream'} progress`}
      >
        <div
          className="stream-progress__fill"
          style={{
            width: formatPercent(fraction),
            background: tokenColor(stream.token),
          }}
        />
      </div>
      {showCounter && (
        <div className="stream-progress__meta">
          <span className="stream-progress__streamed">
            {formatToken(streamed, stream.token, 4)}
          </span>
          <span className="stream-progress__total">
            of {formatToken(stream.total, stream.token)} ·{' '}
            {formatPercent(fraction)}
          </span>
        </div>
      )}
    </div>
  );
}
