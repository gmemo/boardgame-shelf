import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Plus } from 'lucide-react';
import { useSessionStore } from '../../stores';
import SessionCard from '../../components/session-card';
import EmptyState from '../../components/ui/empty-state';
import type { PlaySession } from '../../types';

type SessionStatus = 'active' | 'completed' | 'abandoned';

const STATUS_ORDER: SessionStatus[] = ['active', 'completed', 'abandoned'];
const STATUS_LABELS: Record<SessionStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

export default function SessionsPage() {
  const navigate = useNavigate();
  const { sessions } = useSessionStore();

  const grouped = useMemo(() => {
    const map = new Map<SessionStatus, PlaySession[]>();
    for (const status of STATUS_ORDER) {
      map.set(status, []);
    }
    for (const session of sessions) {
      const list = map.get(session.status);
      if (list) list.push(session);
    }
    return map;
  }, [sessions]);

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
          <button
            onClick={() => navigate('/session/new')}
            className="flex items-center justify-center w-9 h-9 rounded-full glass-pill text-text-secondary hover:text-primary transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Timer size={48} strokeWidth={1.5} />}
            title="No sessions yet"
            description="Track in-progress games, scores, and chapters across multiple play sessions."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {STATUS_ORDER.map((status) => {
              const list = grouped.get(status) ?? [];
              if (list.length === 0) return null;
              return (
                <div key={status}>
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    {STATUS_LABELS[status]}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {list.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onClick={() => navigate(`/session/${session.id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
