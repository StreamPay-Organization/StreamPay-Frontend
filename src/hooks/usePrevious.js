import { useEffect, useRef } from 'react';

/**
 * Remember the value a prop or state had on the previous render.
 * Returns undefined on the first render.
 * @template T
 * @param {T} value
 * @returns {T | undefined}
 */
export function usePrevious(value) {
  const ref = useRef(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
