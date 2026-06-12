import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_TOKEN } from '../constants/tokens.js';
import { validateStreamForm } from '../utils/validate.js';
import { formatToken } from '../utils/format.js';
import { ratePerDay } from '../utils/stream.js';
import { DAY } from '../utils/time.js';
import { createStream } from '../services/streams.js';
import { useWallet } from '../hooks/useWallet.js';
import TokenSelect from '../components/TokenSelect.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import WalletButton from '../components/WalletButton.jsx';
import './CreateStream.css';

/** Format a Date to the value expected by datetime-local inputs. */
function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const now = new Date();
const inWeek = new Date(now.getTime() + 7 * DAY);

export default function CreateStream() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const [form, setForm] = useState({
    recipient: '',
    token: DEFAULT_TOKEN,
    total: '',
    label: '',
    startStr: toLocalInput(now),
    endStr: toLocalInput(inWeek),
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [touched, setTouched] = useState(false);

  const start = new Date(form.startStr).getTime();
  const end = new Date(form.endStr).getTime();

  const errors = useMemo(
    () =>
      validateStreamForm({
        recipient: form.recipient,
        amount: form.total,
        start,
        end,
      }),
    [form.recipient, form.total, start, end]
  );
  const isValid = Object.keys(errors).length === 0;

  // Streaming rate preview (per day).
  const rate = useMemo(
    () => ratePerDay(Number(form.total), start, end),
    [form.total, start, end]
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createStream({
        recipient: form.recipient,
        token: form.token,
        total: form.total,
        label: form.label,
        start,
        end,
      });
      navigate(`/streams/${created.id}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create stream');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConnected) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect your wallet"
        description="Connect a wallet before creating a stream."
        action={<WalletButton />}
      />
    );
  }

  return (
    <div className="create-stream">
      <div className="page-header">
        <h1 className="page-header__title">Create a stream</h1>
        <p className="page-header__subtitle">
          Define a recipient, token and time window. Funds stream every second.
        </p>
      </div>

      <form className="create-stream__form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">Recipient address</span>
          <input
            className="field__input"
            type="text"
            placeholder="G…"
            value={form.recipient}
            onChange={(e) => update('recipient', e.target.value)}
          />
          {touched && errors.recipient && (
            <span className="field__error">{errors.recipient}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Token</span>
          <TokenSelect
            value={form.token}
            onChange={(v) => update('token', v)}
          />
        </label>

        <label className="field">
          <span className="field__label">Total amount</span>
          <input
            className="field__input"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={form.total}
            onChange={(e) => update('total', e.target.value)}
          />
          {touched && errors.amount && (
            <span className="field__error">{errors.amount}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Label (optional)</span>
          <input
            className="field__input"
            type="text"
            placeholder="e.g. June salary"
            value={form.label}
            onChange={(e) => update('label', e.target.value)}
          />
        </label>

        <div className="create-stream__row">
          <label className="field">
            <span className="field__label">Start time</span>
            <input
              className="field__input"
              type="datetime-local"
              value={form.startStr}
              onChange={(e) => update('startStr', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">End time</span>
            <input
              className="field__input"
              type="datetime-local"
              value={form.endStr}
              onChange={(e) => update('endStr', e.target.value)}
            />
          </label>
        </div>
        {touched && errors.window && (
          <span className="field__error">{errors.window}</span>
        )}

        <div className="create-stream__preview">
          <span className="create-stream__preview-label">Streaming rate</span>
          <strong>
            {rate > 0 ? `${formatToken(rate, form.token, 4)} / day` : '—'}
          </strong>
        </div>

        {submitError && <ErrorMessage message={submitError} />}

        <Button type="submit" loading={submitting} disabled={touched && !isValid}>
          Start streaming
        </Button>
      </form>
    </div>
  );
}
