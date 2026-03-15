import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePreferencesStore } from './stores';
import Layout from './app/layout';
import CollectionPage from './app/collection/page';
import PlaysPage from './app/plays/page';
import StatsPage from './app/stats/page';
import SettingsPage from './app/settings/page';
import WelcomePage from './app/welcome/page';
import GameDetailPage from './app/game/page';
import GameNewPage from './app/game/new/page';
import GameEditPage from './app/game/edit/page';
import LogPlayPage from './app/plays/log/page';
import GameLogPlayPage from './app/game/log-play/page';

function useApplyTheme() {
  const { preferences } = usePreferencesStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);
    root.setAttribute('data-accent', preferences.accentColor);

    const themeColor = preferences.theme === 'dark' ? '#09090B' : '#FAFAFA';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColor);
  }, [preferences.theme, preferences.accentColor]);
}

function AppRoutes() {
  const { preferences } = usePreferencesStore();
  useApplyTheme();

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
      <Route path="/game/new" element={<GameNewPage />} />
      <Route path="/game/:id" element={<GameDetailPage />} />
      <Route path="/game/:id/edit" element={<GameEditPage />} />
      <Route path="/game/:id/log-play" element={<GameLogPlayPage />} />
      <Route path="/plays/log" element={<LogPlayPage />} />
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
