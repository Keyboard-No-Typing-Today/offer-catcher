import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import MatchModule from './modules/MatchModule.jsx';
import AssistantModule from './modules/AssistantModule.jsx';
import MeModule from './modules/MeModule.jsx';
import useAppStore from './store/useAppStore.js';

function BootScreen() {
  return (
    <div className="m-boot">
      <div className="m-brand-mark"><span>捕</span></div>
      <div className="m-brand-name">Offer 捕手</div>
      <div className="m-muted">正在打开你的求职作战手册</div>
    </div>
  );
}

export default function App() {
  const hydrated = useAppStore((state) => state.hydrated);
  const setHydrated = useAppStore((state) => state.setHydrated);

  useEffect(() => {
    if (hydrated) return undefined;
    const timer = setTimeout(() => setHydrated(true), 900);
    return () => clearTimeout(timer);
  }, [hydrated, setHydrated]);

  if (!hydrated) return <BootScreen />;

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<MatchModule />} />
          <Route path="/assistant" element={<AssistantModule />} />
          <Route path="/settings" element={<MeModule />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
