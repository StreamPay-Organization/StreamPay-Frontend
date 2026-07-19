import { Link } from 'react-router-dom';
import { useStreams } from '../hooks/useStreams.js';
import { useWallet } from '../hooks/useWallet.js';
import StreamCard from '../components/StreamCard.jsx';
import DashboardSummary from '../components/DashboardSummary.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';
import WalletButton from '../components/WalletButton.jsx';
import './Dashboard.css';

/**
 * Placeholder card shown in place of a StreamCard while streams load.
 */
function StreamCardSkeleton() {
  return (
    <div className="stream-card">
      <Skeleton width="40%" height="1.1rem" />
      <Skeleton width="70%" height="1.2rem" className="dashboard__skeleton-row" />
      <Skeleton width="50%" className="dashboard__skeleton-row" />
      <Skeleton height="8px" className="dashboard__skeleton-row" />
    </div>
  );
}

/**
 * Render a titled section of streams with loading/error/empty handling.
 */
function StreamSection({ title, direction }) {
  const { streams, loading, error, refetch } = useStreams(direction);

  return (
    <section className="dashboard__section">
      <h2 className="dashboard__section-title">{title}</h2>
      <div aria-live="polite" aria-atomic="true">
        {loading && (
          <div className="dashboard__grid">
            <StreamCardSkeleton />
            <StreamCardSkeleton />
            <StreamCardSkeleton />
          </div>
        )}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {!loading && !error && streams.length === 0 && (
          <EmptyState
            icon="🌊"
            title="No streams yet"
            description="When you create or receive a stream it will show up here."
          />
        )}
        {!loading && !error && streams.length > 0 && (
          <div className="dashboard__grid">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Dashboard showing incoming and outgoing streams.
 */
export default function Dashboard() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <EmptyState
        icon="🔌"
        title="Connect your wallet"
        description="Connect a wallet to view your incoming and outgoing streams."
        action={<WalletButton />}
      />
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header dashboard__header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">
            Track money flowing in and out in real time.
          </p>
        </div>
        <Link to="/create">
          <Button>New stream</Button>
        </Link>
      </div>

      <DashboardSummary />

      <StreamSection title="Incoming" direction="incoming" />
      <StreamSection title="Outgoing" direction="outgoing" />
    </div>
  );
}
