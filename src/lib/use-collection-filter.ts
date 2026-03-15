import { useMemo } from 'react';
import { useGameStore, useCollectionFilterStore } from '../stores';
import { filterGames } from './filter-games';

export type { SortField, SortDirection } from '../stores/collection-filter-store';

export function useCollectionFilter() {
  const { games } = useGameStore();
  const store = useCollectionFilterStore();

  const hasActiveFilters = store.search !== '' ||
    store.tagIds.length > 0 ||
    store.playerCount !== null ||
    store.maxPlayTime !== null;

  const filteredGames = useMemo(() => {
    const result = filterGames([...games], {
      search: store.search,
      tagIds: store.tagIds,
      playerCount: store.playerCount,
      maxPlayTime: store.maxPlayTime,
    });

    const dir = store.sortDirection === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (store.sortBy) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'rating':
          return dir * ((a.rating ?? 0) - (b.rating ?? 0));
        case 'complexity':
          return dir * (a.complexity - b.complexity);
        case 'recentlyAdded':
          return dir * a.createdAt.localeCompare(b.createdAt);
        case 'playTime':
          return dir * (a.playTimeMinutes - b.playTimeMinutes);
        default:
          return 0;
      }
    });

    return result;
  }, [games, store.search, store.tagIds, store.playerCount, store.maxPlayTime, store.sortBy, store.sortDirection]);

  return {
    filters: {
      search: store.search,
      tagIds: store.tagIds,
      playerCount: store.playerCount,
      maxPlayTime: store.maxPlayTime,
      sortBy: store.sortBy,
      sortDirection: store.sortDirection,
    },
    setSearch: store.setSearch,
    toggleTagFilter: store.toggleTagFilter,
    setPlayerCount: store.setPlayerCount,
    setMaxPlayTime: store.setMaxPlayTime,
    setSortBy: store.setSortBy,
    setSortDirection: store.setSortDirection,
    resetFilters: store.resetFilters,
    hasActiveFilters,
    filteredGames,
  };
}
