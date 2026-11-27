export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTIES: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD"];

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const WORDLE_PRESETS: Record<DifficultyLevel, { maxAttempts: number; showHints: boolean; summary: string }> = {
  EASY: { maxAttempts: 8, showHints: true, summary: "8 guesses, hints available" },
  MEDIUM: { maxAttempts: 6, showHints: true, summary: "6 guesses, hints available" },
  HARD: { maxAttempts: 4, showHints: false, summary: "4 guesses, no hints" },
};

export const WORDSEARCH_PRESETS: Record<
  DifficultyLevel,
  { size: number; wordCount: number; summary: string }
> = {
  EASY: { size: 8, wordCount: 4, summary: "Across and down only" },
  MEDIUM: { size: 10, wordCount: 6, summary: "Adds diagonals" },
  HARD: { size: 12, wordCount: 8, summary: "All eight directions, including backwards" },
};
