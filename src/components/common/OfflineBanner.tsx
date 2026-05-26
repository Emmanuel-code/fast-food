import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-success/90 text-white text-sm font-medium py-2 px-4 animate-in slide-in-from-top duration-300">
        <Wifi size={16} />
        Back online!
      </div>
    );
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-destructive text-destructive-foreground text-sm font-medium py-2 px-4">
      <WifiOff size={16} />
      No internet connection – some features may be unavailable
    </div>
  );
}
