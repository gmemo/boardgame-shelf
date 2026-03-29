import { useParams, Navigate } from 'react-router-dom';
import { useSessionStore } from '../../../../stores';
import SessionForm from '../../../../components/session-form';

export default function SessionEditPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions } = useSessionStore();
  const session = sessions.find((s) => s.id === id);

  if (!session) return <Navigate to="/sessions" replace />;

  return <SessionForm session={session} />;
}
