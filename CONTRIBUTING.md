# Contributing to StreamPay

Thanks for your interest in improving StreamPay! This is a frontend demo with a
mocked Stellar wallet and SDK, so contributions stay entirely in the browser —
no keys, no network.

## Getting set up

```bash
npm install
npm run dev
```

## Project conventions

- **Components** live in `src/components/` as `Name.jsx` with a sibling
  `Name.css`. Default-export one component per file and document props with a
  JSDoc block.
- **Hooks** live in `src/hooks/` and are named `useThing.js` with a named
  export. Keep them small and side-effect-safe.
- **Utilities** in `src/utils/` are pure functions with JSDoc. Add a test-able
  unit rather than inlining logic in a component.
- **Styling** uses plain CSS with the global custom properties defined in
  `src/index.css` (`--color-*`, `--radius`, `--shadow`, …). Avoid hard-coded
  colors so theming keeps working.
- Respect `prefers-reduced-motion` for any new animation.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add ProgressRing component
fix: clamp elapsed fraction past stream end
docs: document environment variables
```

Keep each commit focused on a single, coherent change.

## Before opening a PR

- Run `npm run build` to confirm the app compiles.
- Check the UI in a narrow viewport — layouts should stay usable on mobile.
- Make sure interactive elements are reachable by keyboard and have a visible
  focus ring.

## Accessibility checklist

- Provide text alternatives (`aria-label`) for icon-only controls.
- Use `role="status"` / `role="alert"` for live messages.
- Don't convey meaning with color alone.
