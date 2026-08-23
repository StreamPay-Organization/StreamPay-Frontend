import { useCallback, useEffect, useRef, useState } from 'react';
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
import ModalDialog from '../components/ModalDialog.jsx';
import FormField from '../components/FormField.jsx';
import './StreamDetail.css';

export default function StreamDetail() {
  const { id } = useParams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outcomeMessage, setOutcomeMessage] = useState(null);
  const [action, setAction] = useState(null); // 'withdraw' | 'cancel'
  const [confirmingAction, setConfirmingAction] = useState(null); // 'withdraw' | 'cancel' | null

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawFieldError, setWithdrawFieldError] = useState(null);

  const withdrawBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);

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

  const token = getToken(stream?.token);
  const { outgoing: isSender, claimable = 0, remaining = 0 } = stream
    ? deriveStream(stream, currentAddress())
    : {};
  const active = stream?.status === 'active';

  function openWithdrawModal() {
    setError(null);
    setOutcomeMessage(null);
    setWithdrawAmount(claimable > 0 ? claimable.toFixed(4) : '0');
    setWithdrawFieldError(null);
    setConfirmingAction('withdraw');
  }

  function openCancelModal() {
    setError(null);
    setOutcomeMessage(null);
    setConfirmingAction('cancel');
  }

  async function handleConfirmWithdraw(e) {
    if (e) e.preventDefault();
    const numAmount = Number(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setWithdrawFieldError('Please enter a valid withdrawal amount');
      return;
    }
    if (numAmount > claimable + 0.0001) {
      setWithdrawFieldError('Amount exceeds claimable balance');
      return;
    }

    setAction('withdraw');
    setError(null);
    try {
      const updated = await withdrawStream(id);
      setStream(updated);
      setOutcomeMessage(`Successfully withdrew ${formatToken(claimable, stream.token, 4)}`);
      setConfirmingAction(null);
    } catch (e) {
      setError(e.message || 'Withdraw failed');
    } finally {
      setAction(null);
    }
  }

  async function handleConfirmCancel(e) {
    if (e) e.preventDefault();
    setAction('cancel');
    setError(null);
    try {
      const updated = await cancelStream(id);
      setStream(updated);
      setOutcomeMessage(`Stream cancelled successfully. Reclaimed ${formatToken(remaining, stream.token)}.`);
      setConfirmingAction(null);
    } catch (e) {
      setError(e.message || 'Cancel failed');
    } finally {
      setAction(null);
    }
  }

  if (loading) return <Loader label="Loading stream…" />;
  if (error && !stream) return <ErrorMessage message={error} onRetry={load} />;
  if (!stream) return null;

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

        <div role="status" aria-live="polite" aria-atomic="true">
          {outcomeMessage && (
            <div className="stream-detail__status-banner" data-testid="outcome-message">
              {outcomeMessage}
            </div>
          )}
        </div>

        <div aria-live="assertive" aria-atomic="true">
          {error && <ErrorMessage message={error} />}
        </div>

        <div className="stream-detail__actions">
          {!isSender && (
            <Button
              ref={withdrawBtnRef}
              onClick={openWithdrawModal}
              loading={action === 'withdraw'}
              disabled={!active || claimable <= 0}
              aria-haspopup="dialog"
              aria-expanded={confirmingAction === 'withdraw'}
            >
              Withdraw {formatToken(claimable, stream.token, 4)}
            </Button>
          )}
          {isSender && (
            <Button
              ref={cancelBtnRef}
              variant="danger"
              onClick={openCancelModal}
              loading={action === 'cancel'}
              disabled={!active}
              aria-haspopup="dialog"
              aria-expanded={confirmingAction === 'cancel'}
            >
              Cancel &amp; reclaim {formatToken(remaining, stream.token)}
            </Button>
          )}
        </div>
      </div>

      {/* Withdraw Confirmation Dialog */}
      <ModalDialog
        isOpen={confirmingAction === 'withdraw'}
        onClose={() => setConfirmingAction(null)}
        title="Confirm Withdrawal"
        titleId="withdraw-dialog-title"
        description={`Confirm withdrawing claimable funds from stream "${stream.label}" to your wallet.`}
        descriptionId="withdraw-dialog-desc"
        triggerRef={withdrawBtnRef}
        role="dialog"
      >
        <form onSubmit={handleConfirmWithdraw} noValidate>
          <FormField
            id="withdraw-amount-input"
            label={`Withdrawal amount (${stream.token})`}
            error={withdrawFieldError}
          >
            <input
              id="withdraw-amount-input"
              type="number"
              min="0"
              max={claimable}
              step="any"
              className="field__input"
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
                setWithdrawFieldError(null);
              }}
              aria-invalid={!!withdrawFieldError}
              aria-errormessage={withdrawFieldError ? 'withdraw-amount-input-error' : undefined}
              aria-describedby="withdraw-dialog-desc"
            />
          </FormField>

          <div className="modal-dialog__actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmingAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={action === 'withdraw'}
            >
              Confirm Withdrawal
            </Button>
          </div>
        </form>
      </ModalDialog>

      {/* Cancel Confirmation Dialog */}
      <ModalDialog
        isOpen={confirmingAction === 'cancel'}
        onClose={() => setConfirmingAction(null)}
        title="Cancel Stream & Reclaim Funds"
        titleId="cancel-dialog-title"
        description={`Are you sure you want to cancel stream "${stream.label}"? This will stop future streaming and reclaim ${formatToken(remaining, stream.token)} to your wallet.`}
        descriptionId="cancel-dialog-desc"
        triggerRef={cancelBtnRef}
        role="alertdialog"
      >
        <form onSubmit={handleConfirmCancel}>
          <p className="stream-detail__modal-warning">
            This is a permanent action and cannot be undone.
          </p>

          <div className="modal-dialog__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingAction(null)}
            >
              Keep Stream Active
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={action === 'cancel'}
            >
              Yes, Cancel Stream
            </Button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
