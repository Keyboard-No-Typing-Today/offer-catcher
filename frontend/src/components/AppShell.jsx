import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import Toast from './Toast.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import { useCapacitorShell } from '../hooks/useCapacitorShell.js';
import { useNetworkStatus } from '../hooks/useNetworkStatus.js';

const TAB_ROUTES = new Set(['/', '/jobs', '/assistant', '/settings']);

export default function AppShell() {
  useCapacitorShell();
  const online = useNetworkStatus();
  const location = useLocation();
  const showTabs = TAB_ROUTES.has(location.pathname);

  return (
    <div className="app-shell">
      <OfflineBanner online={online} />
      <main className="app-main">
        <Outlet />
      </main>
      {showTabs ? <BottomNav /> : null}
      <Toast />
    </div>
  );
}
