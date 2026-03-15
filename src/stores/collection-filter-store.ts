import { create } from 'zustand';

export type SortField = 'name' | 'rating' | 'complexity' | 'recentlyAdded' | 'playTime';
export type SortDirection = 'asc' | 'desc';

interface CollectionFilterState {
  search: string;
  tagIds: string[];
  playerCount: number | null;
  maxPlayTime: number | null;
  sortBy: SortField;
  sortDirection: SortDirection;
  isSearchOpen: boolean;

  setSearch: (search: string) => void;
  toggleTagFilter: (tagId: string) => void;
  setPlayerCount: (count: number | null) => void;
  setMaxPlayTime: (time: number | null) => void;
  setSortBy: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  setSearchOpen: (open: boolean) => void;
  closeSearch: () => void;
  resetFilters: () => void;
}

export const useCollectionFilterStore = create<CollectionFilterState>()((set) => ({
  search: '',
  tagIds: [],
  playerCount: null,
  maxPlayTime: null,
  sortBy: 'recentlyAdded',
  sortDirection: 'desc',
  isSearchOpen: false,

  setSearch: (search) => set({ search }),
  toggleTagFilter: (tagId) =>
    set((state) => ({
      tagIds: state.tagIds.includes(tagId)
        ? state.tagIds.filter((id) => id !== tagId)
        : [...state.tagIds, tagId],
    })),
  setPlayerCount: (playerCount) => set({ playerCount }),
  setMaxPlayTime: (maxPlayTime) => set({ maxPlayTime }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  closeSearch: () => set({ isSearchOpen: false }),
  resetFilters: () =>
    set({
      search: '',
      tagIds: [],
      playerCount: null,
      maxPlayTime: null,
      sortBy: 'recentlyAdded',
      sortDirection: 'desc',
    }),
}));
