import { useCallback, useState } from 'react';

/**
 * State that is mirrored to localStorage, surviving reloads. Falls back to the
 * initial value when storage is unavailable or holds invalid JSON.
 * @template T
 * @param {string} key - storage key
 * @param {T} initialValue
 * @returns {[T, (value: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initialValue : JSON.parse(raw);
    } catch (e) {
      return initialValue;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch (e) {
          /* ignore storage errors (private mode, quota, …) */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}
