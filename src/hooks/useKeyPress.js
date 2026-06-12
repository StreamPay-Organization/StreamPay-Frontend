import { useEffect, useRef } from 'react';

/**
 * Run a handler whenever a specific key is pressed. The key is matched against
 * KeyboardEvent.key (e.g. 'Escape', 'Enter', 'ArrowDown').
 * @param {string} targetKey - the KeyboardEvent.key to listen for
 * @param {(event: KeyboardEvent) => void} handler - called on a match
 * @param {boolean} [enabled] - skip listening when false
 */
export function useKeyPress(targetKey, handler, enabled = true) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (event) => {
      if (event.key === targetKey) savedHandler.current(event);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [targetKey, enabled]);
}
