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

## Tech stack

- React 18
- Vite 5
- react-router-dom 6
- Plain CSS (per-component stylesheets + global CSS variables)
- Mock Stellar wallet / SDK (no network)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to http://localhost:5173).

Copy `.env.example` to `.env` if you want to tweak the demo settings.

### Scripts

| Script            | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start the Vite dev server.   |
| `npm run build`   | Build for production.        |
| `npm run preview` | Preview the production build.|

## Environment variables

All variables are optional and prefixed with `VITE_` so Vite exposes them to
the client. See `.env.example` for the full list and defaults.

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `VITE_APP_NAME`         | Display name for the app.                        |
| `VITE_STELLAR_NETWORK`  | Network the mock wallet reports (`TESTNET`/`PUBLIC`). |
| `VITE_MOCK_LATENCY_MS`  | Simulated latency for the mock services.         |
| `VITE_SOROBAN_RPC_URL`  | Soroban RPC endpoint (unused by the mock build). |

## Project structure

```
src/
  components/   reusable UI (Navbar, StreamCard, StreamProgress, …)
  pages/        routed pages (Home, Dashboard, CreateStream, …)
  services/     mock api, wallet and streams
  context/      AppContext (wallet state)
  hooks/        useWallet, useStreams, useNow, useLocalStorage
  utils/        format, validate, time, stream helpers
  constants/    token list
```

## How streaming works

A stream has a `total`, a `start` and an `end`. At any moment the amount
streamed is `total * elapsedFraction(start, end, now)`. Recipients can
withdraw the streamed-but-unclaimed portion; senders can cancel and reclaim
whatever has not streamed yet.

## Accessibility

- A visible focus ring is shown for keyboard users (`:focus-visible`).
- Live progress bars are exposed as ARIA `progressbar`s with current values.
- Loaders and error banners use `role="status"` / `role="alert"` so screen
  readers announce state changes.
- Dashboard stream sections use `aria-live="polite"` to announce loading,
  empty, and content updates without interrupting the user.
- Form submission errors in CreateStream use `aria-live="assertive"` so
  validation and submission failures are announced immediately.
- Stream detail action errors (withdraw/cancel) use `aria-live="assertive"`
  so failures are surfaced to assistive technology as soon as they occur.
- Skeleton shimmer animations respect `prefers-reduced-motion`.

## License

MIT — demo project.
