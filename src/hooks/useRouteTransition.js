import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to track route transition state.
 * Returns isTransitioning boolean that indicates if a route change is in progress.
 * 
 * @returns {{isTransitioning: boolean, progress: number}}
 */
export function useRouteTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start transition
    setIsTransitioning(true);
    setProgress(30);

    // Simulate progressive loading
    const progressTimer = setTimeout(() => {
      setProgress(70);
    }, 150);

    // Complete transition
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsTransitioning(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [location.pathname, location.search]);

  return { isTransitioning, progress };
}
