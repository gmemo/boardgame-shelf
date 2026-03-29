// Sessions are now created only via the Scorekeeper "Pause" action.
// This form is kept for session notes editing only (accessed from session detail).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { PlaySession } from '../types';
import { useSessionStore } from '../stores';
import Button from './ui/button';
import Textarea from './ui/textarea';
import IconButton from './ui/icon-button';

interface SessionFormProps {
  session: PlaySession;
}

export default function SessionForm({ session }: SessionFormProps) {
  const navigate = useNavigate();
  const { updateSession } = useSessionStore();

  const [notes, setNotes] = useState(session.notes ?? '');

  const handleSave = () => {
    updateSession(session.id, { notes: notes.trim() });
    navigate(`/session/${session.id}`, { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="ambient-glow" />

      <div className="flex items-center gap-2 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent sticky top-0 z-10">
        <IconButton onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="text-lg font-semibold text-text-primary">Edit Notes</h1>
      </div>

      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="flex flex-col gap-5 p-4 pb-28">
          <Textarea
            label="Notes"
            placeholder="Session notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong z-10">
        <Button className="w-full" size="lg" onClick={handleSave}>
          Save Notes
        </Button>
      </div>
    </div>
  );
}
