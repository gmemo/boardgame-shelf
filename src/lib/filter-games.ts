import type { BoardGame } from '../types';

export interface GameFilterOptions {
  search?: string;
  tagIds?: string[];
  playerCount?: number | null;
  maxPlayTime?: number | null;
}

export function filterGames(games: BoardGame[], options: GameFilterOptions): BoardGame[] {
  let result = games;
  const query = (options.search ?? '').toLowerCase().trim();

  if (query) {
    result = result.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query),
    );
  }

  if (options.tagIds && options.tagIds.length > 0) {
    result = result.filter((g) =>
      options.tagIds!.every((tagId) => g.tagIds.includes(tagId)),
    );
  }

  if (options.playerCount != null) {
    result = result.filter(
      (g) => g.minPlayers <= options.playerCount! && g.maxPlayers >= options.playerCount!,
    );
  }

  if (options.maxPlayTime != null) {
    result = result.filter((g) => g.playTimeMinutes <= options.maxPlayTime!);
  }

  return result;
}
