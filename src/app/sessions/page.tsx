import { useNavigate } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { useSessionStore } from '../../stores';
import SessionCard from '../../components/session-card';
import EmptyState from '../../components/ui/empty-state';

export default function SessionsPage() {
  const navigate = useNavigate();
  const { sessions } = useSessionStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Sessions</h1>
            {sessions.length > 0 && (
              <span className="text-xs font-medium text-text-secondary glass-pill px-2 py-0.5 rounded-full">
                {sessions.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Timer size={48} strokeWidth={1.5} />}
            title="No paused games"
            description="Start a game from any game card to track scores, then pause to save your progress."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => navigate(`/session/${session.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
