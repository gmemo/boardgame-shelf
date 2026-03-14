import { useNavigate } from 'react-router-dom';
import { Dices } from 'lucide-react';
import { usePreferencesStore } from '../../stores';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setPreferences } = usePreferencesStore();

  const handleStart = () => {
    setPreferences({ hasSeenWelcome: true });
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
        <Dices size={40} className="text-primary" />
      </div>
      <h1 className="text-3xl font-bold">Boardgame Shelf</h1>
      <p className="text-text-secondary max-w-sm">
        Track your board game collection, log play sessions, and see your gaming stats — all offline.
      </p>
      <button
        onClick={handleStart}
        className="mt-4 px-8 py-3 rounded-xl bg-primary text-white font-semibold text-lg transition-transform active:scale-95"
      >
        Get Started
      </button>
    </div>
  );
}
