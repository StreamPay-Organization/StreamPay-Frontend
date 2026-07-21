# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/) and this project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Global route transition loading indicator with progress bar at the top of the screen.
- `RouteLoader` component that displays during navigation between pages.
- `useRouteTransition` hook for tracking route transition state.
- Accessibility support for route loading indicator with ARIA progressbar attributes.
- Reduced motion support for route loading animations.
- Automated tests for RouteLoader component and useRouteTransition hook.
- Hooks: `useToggle`, `useInterval`, `usePrevious`, `useOnClickOutside`,
  `useKeyPress`, `useWindowSize` for common UI and lifecycle needs.
- Components: `Tooltip`, `CopyButton`, `Tag`, `Avatar`, `Alert`, `Spinner` and
  a circular `ProgressRing` for compact stream completion.
- Utilities: `abbreviateNumber` and `formatRate` formatters; `isPositiveInt`,
  `validateLabel` and `isFutureTime` validators.
- Constants: quick-pick stream `DURATION_PRESETS`.
- Styling: `.sr-only`, `.truncate` and `.hide-mobile` helpers plus a global
  `prefers-reduced-motion` guard.
- Docs: contributing guide.

### Changed

- `useNow` now builds on the new `useInterval` hook.

## [0.1.0]

### Added

- Initial StreamPay frontend: Home, Dashboard, Create Stream and Stream Detail
  pages backed by a mocked Stellar wallet and streaming SDK.
- Live "streamed so far" counters and progress bars.
- Reusable UI primitives (Button, Badge, StatCard, EmptyState, …) and core
  format/time/stream/validate utilities.
