import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePreferencesStore } from './stores';
import Layout from './app/layout';
import CollectionPage from './app/collection/page';
import PlaysPage from './app/plays/page';
import StatsPage from './app/stats/page';
import SettingsPage from './app/settings/page';
import WelcomePage from './app/welcome/page';

function AppRoutes() {
  const { preferences } = usePreferencesStore();

  if (!preferences.hasSeenWelcome) {
    return (
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CollectionPage />} />
        <Route path="/plays" element={<PlaysPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/welcome" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
