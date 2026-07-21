import { useEffect, useState } from 'react';
import { useLocation, useNavigation } from 'react-router-dom';
import './RouteLoader.css';

/**
 * Global loading indicator for route transitions.
 * Shows a progress bar at the top of the screen when navigating between routes.
 */
export default function RouteLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    // Track navigation state if available (React Router v6.4+)
    if (navigation && navigation.state === 'loading') {
      setIsLoading(true);
      setProgress(30);
    } else {
      setIsLoading(false);
      setProgress(100);
    }
  }, [navigation]);

  useEffect(() => {
    // Alternative: Track location changes for basic route transitions
    setIsLoading(true);
    setProgress(50);
    
    // Simulate loading completion after navigation
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div 
      className="route-loader"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={progress}
      aria-label="Page loading"
    >
      <div 
        className="route-loader__bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
