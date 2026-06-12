import { useEffect, useState } from 'react';

/**
 * Track the viewport size, updating on resize. Reads are guarded so the hook is
 * safe to import in non-browser (SSR/test) environments.
 * @returns {{ width: number, height: number }}
 */
export function useWindowSize() {
  const read = () => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  });

  const [size, setSize] = useState(read);

  useEffect(() => {
    const onResize = () => setSize(read());
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
