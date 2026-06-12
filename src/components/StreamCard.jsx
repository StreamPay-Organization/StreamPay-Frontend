import { Link } from 'react-router-dom';
import { getToken } from '../constants/tokens.js';
import { shortAddress } from '../utils/format.js';
import { currentAddress } from '../services/streams.js';
import StreamProgress from './StreamProgress.jsx';
import './StreamCard.css';

/**
 * Summary card for a single stream, used in the dashboard lists.
 * @param {{stream: object}} props
 */
export default function StreamCard({ stream }) {
  const token = getToken(stream.token);
  const outgoing = stream.sender === currentAddress();
  const counterparty = outgoing ? stream.recipient : stream.sender;

  return (
    <Link to={`/streams/${stream.id}`} className="stream-card">
      <div className="stream-card__head">
        <span className="stream-card__token">
          {token?.icon} {stream.token}
        </span>
        <span className={`stream-card__status stream-card__status--${stream.status}`}>
          {stream.status}
        </span>
      </div>

      <div className="stream-card__label">{stream.label}</div>

      <div className="stream-card__party">
        <span className="stream-card__dir">{outgoing ? 'To' : 'From'}</span>
        <code>{shortAddress(counterparty)}</code>
      </div>

      <StreamProgress stream={stream} />
    </Link>
  );
}
