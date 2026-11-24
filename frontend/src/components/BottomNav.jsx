import { NavLink, useLocation } from 'react-router-dom';
import { Home, BriefcaseBusiness, Sparkles, UserRound } from 'lucide-react';
import { hapticTap } from '../hooks/useHaptics.js';

const items = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/jobs', label: '岗位', icon: BriefcaseBusiness, end: true },
  { to: '/assistant', label: '助手', icon: Sparkles, end: true },
  { to: '/settings', label: '我的', icon: UserRound, end: true },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="tabbar" aria-label="主导航">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={'tab' + (active ? ' tab--active' : '')}
            onClick={() => hapticTap('light')}
          >
            <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
            <span className="tab-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
