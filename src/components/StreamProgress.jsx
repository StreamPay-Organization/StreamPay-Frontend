import { elapsedFraction } from '../utils/time.js';
import { formatPercent, formatToken } from '../utils/format.js';
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

  return (
    <div className="stream-progress">
      <div className="stream-progress__bar">
        <div
          className="stream-progress__fill"
          style={{ width: formatPercent(fraction) }}
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
