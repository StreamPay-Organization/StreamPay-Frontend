import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import './Home.css';

const FEATURES = [
  {
    icon: '⏱️',
    title: 'Per-second settlement',
    text: 'Money moves continuously. Recipients can withdraw what has streamed at any moment.',
  },
  {
    icon: '💼',
    title: 'Payroll & retainers',
    text: 'Pay salaries that vest by the second instead of in lumpy monthly batches.',
  },
  {
    icon: '🔁',
    title: 'Subscriptions',
    text: 'Replace recurring charges with a single stream you can cancel anytime.',
  },
  {
    icon: '🛡️',
    title: 'Cancel & reclaim',
    text: 'Senders keep the un-streamed remainder when a stream is cancelled.',
  },
];

const STEPS = [
  'Connect your Stellar wallet.',
  'Create a stream: pick a recipient, token, amount and time window.',
  'Funds stream to the recipient every second until the end time.',
  'Recipient withdraws streamed funds; sender can cancel to reclaim the rest.',
];

/**
 * Landing page explaining what payment streaming is.
 */
export default function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <h1 className="home__title">
          Stream money by the <span className="home__accent">second</span>.
        </h1>
        <p className="home__lead">
          StreamPay turns one-off transfers into continuous flows of value on
          Stellar &amp; Soroban — perfect for salaries, grants and
          subscriptions.
        </p>
        <div className="home__cta">
          <Link to="/create">
            <Button>Create a stream</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary">View dashboard</Button>
          </Link>
        </div>
      </section>

      <section className="home__features">
        {FEATURES.map((f) => (
          <div key={f.title} className="home__feature">
            <div className="home__feature-icon" role="img" aria-label={`${f.title} icon`}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="home__how">
        <h2>How it works</h2>
        <ol className="home__steps">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
