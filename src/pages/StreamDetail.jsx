import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getStream,
  withdrawStream,
  cancelStream,
  currentAddress,
} from '../services/streams.js';
import { deriveStream } from '../utils/stream.js';
import { getToken } from '../constants/tokens.js';
import {
  formatDate,
  formatDuration,
  formatRelative,
  formatToken,
  shortAddress,
} from '../utils/format.js';
import { msRemaining } from '../utils/time.js';
import Avatar from '../components/Avatar.jsx';
import StreamProgress from '../components/StreamProgress.jsx';
import Badge, { statusTone, statusLabel } from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import './StreamDetail.css';

export default function StreamDetail() {
  const { id } = useParams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null); // 'withdraw' | 'cancel'

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return getStream(id)
      .then((data) => {
        if (!data) setError('Stream not found');
        setStream(data);
      })
      .catch((e) => setError(e.message || 'Failed to load stream'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleWithdraw() {
    setAction('withdraw');
    setError(null);
    try {
      const updated = await withdrawStream(id);
      setStream(updated);
    } catch (e) {
      setError(e.message || 'Withdraw failed');
    } finally {
      setAction(null);
    }
  }

  async function handleCancel() {
    setAction('cancel');
    setError(null);
    try {
      const updated = await cancelStream(id);
      setStream(updated);
    } catch (e) {
      setError(e.message || 'Cancel failed');
    } finally {
      setAction(null);
    }
  }

  if (loading) return <Loader label="Loading stream…" />;
  if (error && !stream) return <ErrorMessage message={error} onRetry={load} />;
  if (!stream) return null;

  const token = getToken(stream.token);
  const { outgoing: isSender, claimable, remaining } = deriveStream(
    stream,
    currentAddress()
  );
  const active = stream.status === 'active';

  return (
    <div className="stream-detail">
      <Link to="/dashboard" className="stream-detail__back">
        ← Back to dashboard
      </Link>

      <div className="page-header stream-detail__header">
        <div>
          <h1 className="page-header__title">
            <span role="img" aria-label={`${stream.token} icon`}>{token?.icon}</span> {stream.label}
          </h1>
          <p className="page-header__subtitle">
            {isSender ? 'Outgoing' : 'Incoming'} ·{' '}
            <Badge tone={statusTone(stream.status)}>
              {statusLabel(stream.status)}
            </Badge>
          </p>
        </div>
      </div>

      <div className="stream-detail__card">
        <StreamProgress stream={stream} />

        <dl className="stream-detail__grid">
          <div>
            <dt>From</dt>
            <dd>
              <div className="stream-detail__address-wrapper">
                <Avatar seed={stream.sender} size={16} />
                <code>{shortAddress(stream.sender)}</code>
              </div>
            </dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>
              <div className="stream-detail__address-wrapper">
                <Avatar seed={stream.recipient} size={16} />
                <code>{shortAddress(stream.recipient)}</code>
              </div>
            </dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatToken(stream.total, stream.token)}</dd>
          </div>
          <div>
            <dt>Withdrawn</dt>
            <dd>{formatToken(stream.withdrawn, stream.token)}</dd>
          </div>
          <div>
            <dt>Claimable now</dt>
            <dd>{formatToken(claimable, stream.token, 4)}</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{formatToken(remaining, stream.token)}</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>{formatDate(stream.start)}</dd>
          </div>
          <div>
            <dt>End</dt>
            <dd>
              {formatDate(stream.end)}
              <span className="stream-detail__rel">
                {' '}
                · {formatRelative(stream.end)}
              </span>
            </dd>
          </div>
          <div>
            <dt>Time left</dt>
            <dd>{active ? formatDuration(msRemaining(stream.end)) : '—'}</dd>
          </div>
        </dl>

        <div aria-live="assertive" aria-atomic="true">
          {error && <ErrorMessage message={error} />}
        </div>

        <div className="stream-detail__actions">
          {!isSender && (
            <Button
              onClick={handleWithdraw}
              loading={action === 'withdraw'}
              disabled={!active || claimable <= 0}
            >
              Withdraw {formatToken(claimable, stream.token, 4)}
            </Button>
          )}
          {isSender && (
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={action === 'cancel'}
              disabled={!active}
            >
              Cancel &amp; reclaim {formatToken(remaining, stream.token)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
