/**
 * History types: results of finished quizzes (Firestore), archived from the
 * active quiz's leaderboard when staff end it.
 *
 *   quizzes/{quizId}/results/{uid}   QuizResult
 */

/** One player's final standing in a finished quiz. */
export type QuizResult = {
  id: string;
  displayName: string;
  score: number;
  correctCount: number;
  /** 1-based; tied scores share a rank. */
  rank: number;
};
