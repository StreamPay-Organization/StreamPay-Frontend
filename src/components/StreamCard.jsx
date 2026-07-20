import { Link } from 'react-router-dom';
import { getToken } from '../constants/tokens.js';
import { shortAddress } from '../utils/format.js';
import { deriveStream } from '../utils/stream.js';
import { currentAddress } from '../services/streams.js';
import Avatar from './Avatar.jsx';
import StreamProgress from './StreamProgress.jsx';
import Badge, { statusTone, statusLabel } from './Badge.jsx';
import './StreamCard.css';

/**
 * Summary card for a single stream, used in the dashboard lists.
 * @param {{stream: object}} props
 */
export default function StreamCard({ stream }) {
  const token = getToken(stream.token);
  const { outgoing, counterparty } = deriveStream(stream, currentAddress());

  return (
    <Link to={`/streams/${stream.id}`} className="stream-card">
      <div className="stream-card__head">
        <span className="stream-card__token">
          {token?.icon} {stream.token}
        </span>
        <Badge tone={statusTone(stream.status)}>
          {statusLabel(stream.status)}
        </Badge>
      </div>

      <div className="stream-card__label">{stream.label}</div>

      <div className="stream-card__party">
        <span className="stream-card__dir">{outgoing ? 'To' : 'From'}</span>
        <Avatar seed={counterparty} size={16} />
        <code>{shortAddress(counterparty)}</code>
      </div>

      <StreamProgress stream={stream} />
    </Link>
  );
}
