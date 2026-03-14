import { useParams, Navigate } from 'react-router-dom';
import { useGameStore } from '../../../stores';
import GameForm from '../../../components/game-form';

export default function GameEditPage() {
  const { id } = useParams<{ id: string }>();
  const { games } = useGameStore();
  const game = games.find((g) => g.id === id);

  if (!game) return <Navigate to="/" replace />;

  return <GameForm game={game} />;
}
