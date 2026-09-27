/**
 * Game types: the one quiz that is running right now, in the Realtime Database.
 * Quizzes themselves (and their results once finished) live in Firestore, see
 * `quiz.ts` and `history.ts`.
 *
 *   activeQuiz/meta                         ActiveQuizMeta
 *   activeQuiz/players/{uid}                GamePlayer
 *   activeQuiz/answers/{questionId}/{uid}   GameAnswer
 *   activeQuiz/leaderboard/{uid}            LeaderboardEntry
 *   joinedQuiz/{uid}                        JoinedQuiz
 *
 * There is at most one active quiz: `activeQuiz` exists only while a quiz runs
 * and is removed when it ends. A player may join exactly one quiz, ever;
 * `joinedQuiz/{uid}` is the write-once record the rules check.
 */

export const GAME_STATUSES = ['open', 'closed'] as const;

/** `open`: players can join and answer. `closed`: paused, no joins or answers. */
export type GameStatus = (typeof GAME_STATUSES)[number];

export const isGameStatus = (value: unknown): value is GameStatus =>
  typeof value === 'string' && GAME_STATUSES.some((status) => status === value);

/** `activeQuiz/meta`: which Firestore quiz is running. Timestamps are server milliseconds. */
export type ActiveQuizMeta = {
  quizId: string;
  title: string;
  questionCount: number;
  status: GameStatus;
  startedBy: string;
  startedAt: number;
};

/** `activeQuiz/players/{uid}`: a player who joined the active quiz. */
export type GamePlayer = {
  id: string;
  displayName: string;
  joinedAt: number;
};

/** `activeQuiz/answers/{questionId}/{uid}`: one answer per player per question. */
export type GameAnswer = {
  option: number;
  answeredAt: number;
};

/** `activeQuiz/leaderboard/{uid}`. Created at 0 when the player joins; scores are written by staff/server. */
export type LeaderboardEntry = {
  id: string;
  displayName: string;
  score: number;
  correctCount: number;
};

/** `joinedQuiz/{uid}`: the one quiz this player joined. Write-once; outlives the active quiz. */
export type JoinedQuiz = {
  quizId: string;
  joinedAt: number;
};
