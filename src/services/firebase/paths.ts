/** Single source of Realtime Database paths (architecture §5.1). */
export const rtdbPaths = {
  /** `{ role }` mirror of the Firestore staff entry, keyed by `toEmailKey(email)`. */
  staffByEmail: (emailKey: string) => `staffByEmail/${emailKey}`,
  /** The one quiz running right now; absent when none is. */
  activeQuiz: 'activeQuiz',
  activeQuizMeta: 'activeQuiz/meta',
  activeQuizStatus: 'activeQuiz/meta/status',
  activeQuizPlayer: (userId: string) => `activeQuiz/players/${userId}`,
  activeQuizLeaderboard: 'activeQuiz/leaderboard',
  activeQuizLeaderboardEntry: (userId: string) => `activeQuiz/leaderboard/${userId}`,
  activeQuizAnswer: (questionId: string, userId: string) =>
    `activeQuiz/answers/${questionId}/${userId}`,
  /** Write-once record of the one quiz a player joined. */
  joinedQuiz: (userId: string) => `joinedQuiz/${userId}`,
} as const;

/**
 * Realtime Database keys can't contain `.`; emails are stored with `.` → `,`
 * (commas can't appear in an email). The database rules apply the same mapping
 * to `auth.token.email`.
 */
export const toEmailKey = (email: string) => email.toLowerCase().replaceAll('.', ',');
