export type Kind = "wordle" | "wordsearch";
export type Word = { english: string; phonemes: string[] };
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type ActivitySettings = {
  max_guesses: number;
  hints: boolean;
  show_spelling: boolean;
  shuffle: boolean;
  grid_size: number;
  difficulty: Difficulty;
  seed: number;
  answer_key: boolean;
};

export type ActivityData = {
  kind: Kind;
  title: string;
  instructions: string;
  settings: ActivitySettings;
  words: Word[];
};

export type ActivitySummary = {
  id: string;
  kind: Kind;
  title: string;
  instructions: string;
  word_count: number;
  sounds: string[];
  first_word?: string;
  all_sounds?: string[];
  is_published: boolean;
  is_featured: boolean;
  plays?: number;
  version?: number;
  updated_at?: string | null;
};

export type Activity = ActivitySummary & ActivityData;

export type Role = "visitor" | "teacher" | "admin" | "demo";
export type Me = { role: Role; user: { email: string; name: string; avatar_url: string } | null };

export type PublicConfig = {
  google_client_id: string;
  auth_enabled: boolean;
  demo_enabled: boolean;
  dev_login: boolean;
  release: string;
  daily_enabled: boolean;
  classroom_enabled: boolean;
  maintenance_message: string;
};

export const DEFAULT_SETTINGS: ActivitySettings = {
  max_guesses: 5,
  hints: true,
  show_spelling: true,
  shuffle: false,
  grid_size: 10,
  difficulty: "MEDIUM",
  seed: 1,
  answer_key: true,
};
