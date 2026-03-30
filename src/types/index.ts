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

export interface ScoreCategory {
  id: string;
  name: string;
  increment: number;
}

export interface PlayerScore {
  playerName: string;
  scores: Record<string, number>; // categoryId → value
}

export interface PlaySession {
  id: string;
  gameId: string;
  date: string;
  playerNames: string[];
  categories: ScoreCategory[];
  playerScores: PlayerScore[];
  round: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  type: 'game' | 'expansion';
  linkedGameId: string | null;
  imageUrl: string | null;
  // Optional game fields (null = not set)
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  complexity: (1 | 2 | 3 | 4 | 5) | null;
  tagIds: string[];
  notes: string;
  quickRulesNotes: string;
  // Wishlist-specific optional
  price: string;
  store: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayLog {
  id: string;
  gameId: string;
  date: string; // YYYY-MM-DD
  playerNames: string[];
  winnerName: string | null;
  duration: number | null; // minutes
  notes: string;
  categories: ScoreCategory[];
  playerScores: PlayerScore[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  accentColor: string;
  hasSeenWelcome: boolean;
  notPlayedRecentlyDays: number;
}
