import { Navigate } from 'react-router-dom';

// Sessions are now created only via the Scorekeeper's "Pause" action.
// Redirect to sessions list if accessed directly.
export default function SessionNewPage() {
  return <Navigate to="/sessions" replace />;
}
