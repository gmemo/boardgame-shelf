import { useSearchParams } from 'react-router-dom';
import SessionForm from '../../../components/session-form';

export default function SessionNewPage() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');

  return <SessionForm initialGameId={gameId ?? null} />;
}
