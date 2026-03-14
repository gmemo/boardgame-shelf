import { useParams, Navigate } from 'react-router-dom';
import { useGameStore } from '../../stores';
import GameDetail from '../../components/game-detail';

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { games } = useGameStore();
  const game = games.find((g) => g.id === id);

  if (!game) return <Navigate to="/" replace />;

  return <GameDetail game={game} />;
}
