import { Outlet } from 'react-router-dom';
import BottomNav from '../components/bottom-nav';
import { useSystemTagAutomation } from '../lib/use-system-tag-automation';

export default function Layout() {
  useSystemTagAutomation();

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+max(0.75rem,env(safe-area-inset-bottom)))] relative z-[1] bg-transparent">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
