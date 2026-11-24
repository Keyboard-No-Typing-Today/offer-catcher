import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    let mounted = true;
    let remove = null;

    const setupWeb = () => {
      const onOnline = () => setOnline(true);
      const onOffline = () => setOnline(false);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      remove = () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    };

    (async () => {
      try {
        const status = await Network.getStatus();
        if (mounted) setOnline(status.connected);
        const listener = await Network.addListener('networkStatusChange', (state) => {
          if (mounted) setOnline(state.connected);
        });
        remove = () => listener.remove();
      } catch {
        setupWeb();
      }
    })();

    return () => {
      mounted = false;
      if (remove) remove();
    };
  }, []);

  return online;
}
