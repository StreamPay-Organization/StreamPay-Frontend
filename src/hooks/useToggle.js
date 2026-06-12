import { useCallback, useState } from 'react';

/**
 * Boolean state with a stable toggle plus explicit on/off setters.
 * Handy for modals, drawers, menus and other open/closed UI.
 * @param {boolean} [initial]
 * @returns {[boolean, { toggle: () => void, on: () => void, off: () => void,
 *   set: (value: boolean) => void }]}
 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(Boolean(initial));

  const toggle = useCallback(() => setValue((v) => !v), []);
  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);

  return [value, { toggle, on, off, set: setValue }];
}
