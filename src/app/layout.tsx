import { Outlet } from 'react-router-dom';
import BottomNav from '../components/bottom-nav';
import { useSystemTagAutomation } from '../lib/use-system-tag-automation';

export default function Layout() {
  useSystemTagAutomation();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="ambient-glow" />
      <main className="flex-1 overflow-y-auto pb-24 relative z-[1]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
