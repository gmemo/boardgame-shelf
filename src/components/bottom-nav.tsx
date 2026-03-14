import { useLocation, useNavigate } from 'react-router-dom';
import { Library, Dices, BarChart3, Settings } from 'lucide-react';
import { useNavStore } from '../stores';

const tabs = [
  { path: '/', label: 'Collection', icon: Library },
  { path: '/plays', label: 'Plays', icon: Dices },
  { path: '/stats', label: 'Stats', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveTab } = useNavStore();

  return (
    <nav className="glass-strong fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-16">
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => {
              setActiveTab(path);
              navigate(path);
            }}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
              active ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
