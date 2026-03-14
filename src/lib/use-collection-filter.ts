import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../stores';

export type SortField = 'name' | 'rating' | 'complexity' | 'recentlyAdded' | 'playTime';
export type SortDirection = 'asc' | 'desc';

export interface CollectionFilters {
  search: string;
  tagIds: string[];
  playerCount: number | null;
  maxPlayTime: number | null;
  sortBy: SortField;
  sortDirection: SortDirection;
}

const defaultFilters: CollectionFilters = {
  search: '',
  tagIds: [],
  playerCount: null,
  maxPlayTime: null,
  sortBy: 'recentlyAdded',
  sortDirection: 'desc',
};

export function useCollectionFilter() {
  const { games } = useGameStore();
  const [filters, setFilters] = useState<CollectionFilters>(defaultFilters);

  const setSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search }));
  }, []);

  const toggleTagFilter = useCallback((tagId: string) => {
    setFilters((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((id) => id !== tagId)
        : [...f.tagIds, tagId],
    }));
  }, []);

  const setPlayerCount = useCallback((playerCount: number | null) => {
    setFilters((f) => ({ ...f, playerCount }));
  }, []);

  const setMaxPlayTime = useCallback((maxPlayTime: number | null) => {
    setFilters((f) => ({ ...f, maxPlayTime }));
  }, []);

  const setSortBy = useCallback((sortBy: SortField) => {
    setFilters((f) => ({ ...f, sortBy }));
  }, []);

  const setSortDirection = useCallback((sortDirection: SortDirection) => {
    setFilters((f) => ({ ...f, sortDirection }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = filters.search !== '' ||
    filters.tagIds.length > 0 ||
    filters.playerCount !== null ||
    filters.maxPlayTime !== null;

  const filteredGames = useMemo(() => {
    let result = [...games];
    const query = filters.search.toLowerCase().trim();

    // Search
    if (query) {
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query),
      );
    }

    // Tag filter (AND logic)
    if (filters.tagIds.length > 0) {
      result = result.filter((g) =>
        filters.tagIds.every((tagId) => g.tagIds.includes(tagId)),
      );
    }

    // Player count
    if (filters.playerCount !== null) {
      result = result.filter(
        (g) =>
          g.minPlayers <= filters.playerCount! &&
          g.maxPlayers >= filters.playerCount!,
      );
    }

    // Play time
    if (filters.maxPlayTime !== null) {
      result = result.filter((g) => g.playTimeMinutes <= filters.maxPlayTime!);
    }

    // Sort
    const dir = filters.sortDirection === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (filters.sortBy) {
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
  }, [games, filters]);

  return {
    filters,
    setSearch,
    toggleTagFilter,
    setPlayerCount,
    setMaxPlayTime,
    setSortBy,
    setSortDirection,
    resetFilters,
    hasActiveFilters,
    filteredGames,
  };
}
