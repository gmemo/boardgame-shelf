export interface BoardGame {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  category: GameCategory;
  complexity: 1 | 2 | 3 | 4 | 5;
  rating: number | null;
  imageUrl: string | null;
  notes: string;
  favorite: boolean;
  createdAt: string;
}

export type GameCategory =
  | 'strategy'
  | 'party'
  | 'cooperative'
  | 'deckbuilder'
  | 'worker-placement'
  | 'area-control'
  | 'dice'
  | 'card'
  | 'family'
  | 'other';

export interface Player {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface PlaySession {
  id: string;
  gameId: string;
  date: string;
  playerIds: string[];
  winnerId: string | null;
  duration: number | null;
  notes: string;
  scores: Record<string, number>;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  accentColor: string;
  hasSeenWelcome: boolean;
}
