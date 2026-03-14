import { Outlet } from 'react-router-dom';
import BottomNav from '../components/bottom-nav';

export default function Layout() {
  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
