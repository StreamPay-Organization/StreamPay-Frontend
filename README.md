# StreamPay

Real-time payment streaming on Stellar / Soroban. StreamPay turns one-off
transfers into continuous, per-second flows of value — ideal for salaries,
grants and subscriptions.

> This is a frontend demo. The Stellar wallet and SDK are mocked: there is no
> network access. Data is in-memory with simulated latency.

## Features

- **Home** — landing page explaining payment streaming.
- **Dashboard** — incoming and outgoing streams, each with a live
  "streamed so far" counter and progress bar.
- **Create Stream** — form with validation and a live per-day rate preview.
- **Stream Detail** — progress, withdraw (claim streamed-so-far) and cancel
  (sender reclaims the remainder).
- **Mock wallet** — connect / disconnect with persisted session.
