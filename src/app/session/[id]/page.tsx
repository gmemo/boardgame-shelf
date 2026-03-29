import { useParams, Navigate } from 'react-router-dom';
import { useSessionStore } from '../../../stores';
import SessionDetail from '../../../components/session-detail';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions } = useSessionStore();
  const session = sessions.find((s) => s.id === id);

  if (!session) return <Navigate to="/sessions" replace />;

  return <SessionDetail session={session} />;
}
