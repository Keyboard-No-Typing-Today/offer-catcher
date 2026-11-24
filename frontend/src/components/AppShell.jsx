import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { Home, MessageCircle, UserRound } from 'lucide-react';
import { useCapacitorShell } from '../hooks/useCapacitorShell.js';

const TABS = [
  { key: '/', title: '匹配', icon: <Home size={20} /> },
  { key: '/assistant', title: '助手', icon: <MessageCircle size={20} /> },
  { key: '/settings', title: '我的', icon: <UserRound size={20} /> },
];

export default function AppShell() {
  useCapacitorShell();
  const navigate = useNavigate();
  const location = useLocation();
  const active = TABS.some((tab) => tab.key === location.pathname) ? location.pathname : '/';

  return (
    <div className="m-shell">
      <main className="m-main">
        <Outlet />
      </main>
      <TabBar
        activeKey={active}
        onChange={(key) => navigate(key)}
        safeArea
        className="m-tabbar"
      >
        {TABS.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  );
}
