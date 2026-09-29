import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 z-40 flex items-center justify-center gap-2 rounded-2xl bg-amber-500/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span>Võrguühenduseta režiim — kohalik salvestus on aktiivne.</span>
    </div>
  );
};
