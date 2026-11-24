import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { handleBack } from '../lib/backHandler.js';

export function useCapacitorShell() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#F5F0E6' });
      } catch {
        /* web */
      }
      setTimeout(() => {
        if (mounted) SplashScreen.hide().catch(() => {});
      }, 260);
    };
    boot();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let listener = null;
    (async () => {
      try {
        listener = await CapacitorApp.addListener('backButton', () => {
          if (handleBack()) return;
          const hash = window.location.hash.replace(/^#/, '') || '/';
          const tabs = ['/', '/jobs', '/assistant', '/settings'];
          if (hash === '/') {
            CapacitorApp.exitApp();
          } else if (tabs.includes(hash)) {
            navigate('/');
          } else {
            navigate(-1);
          }
        });
      } catch {
        /* web */
      }
    })();
    return () => { if (listener) listener.remove(); };
  }, [navigate]);
}
