import type { QuizResult } from '@/types/history';
import type { LeaderboardEntry } from '@/types/game';

/** Highest score first; ties by more correct answers, then by name. */
export const byStanding = (a: LeaderboardEntry, b: LeaderboardEntry) =>
  b.score - a.score || b.correctCount - a.correctCount || a.displayName.localeCompare(b.displayName);

/** 1-based rank of `entries[index]` (sorted by standing) where tied scores share a rank. */
export const rankAt = (entries: readonly LeaderboardEntry[], index: number) => {
  const score = entries[index]?.score;
  return entries.findIndex((entry) => entry.score === score) + 1;
};

/** Final standings of a leaderboard, as archived in Firestore. */
export const toQuizResults = (entries: readonly LeaderboardEntry[]): QuizResult[] => {
  const sorted = [...entries].sort(byStanding);
  return sorted.map((entry, index) => ({ ...entry, rank: rankAt(sorted, index) }));
};
