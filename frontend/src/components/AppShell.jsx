import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import Toast from './Toast.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import { useCapacitorShell } from '../hooks/useCapacitorShell.js';
import { useNetworkStatus } from '../hooks/useNetworkStatus.js';
import { useAiAvailability } from '../hooks/useAiAvailability.js';

const TAB_ROUTES = new Set(['/', '/jobs', '/assistant', '/settings']);

export default function AppShell() {
  useCapacitorShell();
  const online = useNetworkStatus();
  const aiState = useAiAvailability();
  const location = useLocation();
  const showTabs = TAB_ROUTES.has(location.pathname);

  return (
    <div className="app-shell">
      <OfflineBanner online={online} aiState={aiState} />
      <main className="app-main">
        <Outlet />
      </main>
      {showTabs ? <BottomNav /> : null}
      <Toast />
    </div>
  );
}
