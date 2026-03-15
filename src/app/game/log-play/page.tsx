import { useParams, useNavigate } from 'react-router-dom';
import PlayLogForm from '../../../components/play-log-form';

export default function GameLogPlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <PlayLogForm
      gameId={id}
      onComplete={() => navigate(`/game/${id}`, { replace: true })}
    />
  );
}
