export interface Tag {
  id: string;
  name: string;
  type: 'system' | 'default' | 'custom';
}

export interface Expansion {
  id: string;
  name: string;
  owned: boolean;
}

export interface BoardGame {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  rating: number | null;
  imageUrl: string | null;
  notes: string;
  quickRulesNotes: string;
  tagIds: string[];
  expansions: Expansion[];
  createdAt: string;
  updatedAt: string;
}

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

export interface PlayLog {
  id: string;
  gameId: string;
  date: string; // YYYY-MM-DD
  playerNames: string[];
  winnerName: string | null;
  duration: number | null; // minutes
  notes: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  accentColor: string;
  hasSeenWelcome: boolean;
  notPlayedRecentlyDays: number;
}
