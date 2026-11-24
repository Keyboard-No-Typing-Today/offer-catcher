import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import WelcomeScreen from './screens/WelcomeScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import ResumeScreen from './screens/ResumeScreen.jsx';
import AnalyzeScreen from './screens/AnalyzeScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';
import JobsScreen from './screens/JobsScreen.jsx';
import JobDetailScreen from './screens/JobDetailScreen.jsx';
import TrackerScreen from './screens/TrackerScreen.jsx';
import AssistantScreen from './screens/AssistantScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import useAppStore from './store/useAppStore.js';

function BootScreen() {
  return (
    <div className="app-frame">
      <div className="welcome" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="brand">
          <div className="brand-mark"><span style={{ fontSize: 18 }}>捕</span></div>
          <span className="brand-name">Offer 捕手</span>
        </div>
        <div className="eyebrow mt-16">正在打开你的求职作战手册</div>
      </div>
    </div>
  );
}

function RouteGate() {
  const hydrated = useAppStore((state) => state.hydrated);
  const profile = useAppStore((state) => state.profile);
  const location = useLocation();
  const setHydrated = useAppStore((state) => state.setHydrated);

  useEffect(() => {
    if (hydrated) return undefined;
    const timer = setTimeout(() => setHydrated(true), 900);
    return () => clearTimeout(timer);
  }, [hydrated, setHydrated]);

  if (!hydrated) return <BootScreen />;
  if (!profile && location.pathname === '/') return <Navigate to="/welcome" replace />;
  return <AppShell />;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<RouteGate />}>
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/" element={<HomeScreen />} />
          <Route path="/resume" element={<ResumeScreen />} />
          <Route path="/analyze" element={<AnalyzeScreen />} />
          <Route path="/result/:id" element={<ResultScreen />} />
          <Route path="/jobs" element={<JobsScreen />} />
          <Route path="/jobs/:id" element={<JobDetailScreen />} />
          <Route path="/tracker" element={<TrackerScreen />} />
          <Route path="/assistant" element={<AssistantScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
