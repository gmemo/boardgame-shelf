import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePreferencesStore } from './stores';
import Layout from './app/layout';
import CollectionPage from './app/collection/page';
import SessionsPage from './app/sessions/page';
import WishlistPage from './app/wishlist/page';
import StatsPage from './app/stats/page';
import SettingsPage from './app/settings/page';
import WelcomePage from './app/welcome/page';
import GameDetailPage from './app/game/page';
import GameNewPage from './app/game/new/page';
import GameEditPage from './app/game/edit/page';
import LogPlayPage from './app/plays/log/page';
import GameLogPlayPage from './app/game/log-play/page';
import SessionNewPage from './app/session/new/page';
import SessionDetailPage from './app/session/[id]/page';
import SessionEditPage from './app/session/[id]/edit/page';
import WishlistNewPage from './app/wishlist/new/page';
import WishlistDetailPage from './app/wishlist/[id]/page';
import WishlistEditPage from './app/wishlist/[id]/edit/page';
import ScorekeeperPage from './app/scorekeeper/page';

function useApplyTheme() {
  const { preferences } = usePreferencesStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);
    root.setAttribute('data-accent', preferences.accentColor);

    const themeColor = preferences.theme === 'dark' ? '#0c0c10' : '#FAFAFA';
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
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/game/new" element={<GameNewPage />} />
      <Route path="/game/:id" element={<GameDetailPage />} />
      <Route path="/game/:id/edit" element={<GameEditPage />} />
      <Route path="/game/:id/log-play" element={<GameLogPlayPage />} />
      <Route path="/plays/log" element={<LogPlayPage />} />
      <Route path="/plays" element={<Navigate to="/sessions" replace />} />
      <Route path="/session/new" element={<SessionNewPage />} />
      <Route path="/session/:id" element={<SessionDetailPage />} />
      <Route path="/session/:id/edit" element={<SessionEditPage />} />
      <Route path="/wishlist/new" element={<WishlistNewPage />} />
      <Route path="/wishlist/:id" element={<WishlistDetailPage />} />
      <Route path="/wishlist/:id/edit" element={<WishlistEditPage />} />
      <Route path="/scorekeeper" element={<ScorekeeperPage />} />
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
