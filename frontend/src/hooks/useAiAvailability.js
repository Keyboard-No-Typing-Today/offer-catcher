import { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore.js';
import { checkHealth } from '../lib/api.js';

// The OS can report "no internet" while a local AI proxy is still reachable
// (e.g. adb reverse). The banner should reflect AI availability, not the
// generic Android network flag.
export function useAiAvailability() {
  const aiEnabled = useAppStore((state) => state.settings.aiEnabled);
  const apiBaseUrl = useAppStore((state) => state.settings.apiBaseUrl);
  const [state, setState] = useState('checking');

  useEffect(() => {
    if (!aiEnabled) {
      setState('disabled');
      return undefined;
    }
    let active = true;
    setState('checking');
    checkHealth(apiBaseUrl)
      .then((health) => {
        if (!active) return;
        setState(health?.chat?.enabled === false ? 'offline' : 'online');
      })
      .catch(() => {
        if (active) setState('offline');
      });
    return () => { active = false; };
  }, [aiEnabled, apiBaseUrl]);

  return state;
}
