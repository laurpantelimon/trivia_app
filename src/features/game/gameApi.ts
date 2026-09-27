/**
 * The active quiz in the Realtime Database (`activeQuiz/…`) and the players'
 * one-quiz lock (`joinedQuiz/{uid}`). Only one quiz runs at a time: starting
 * creates `activeQuiz/meta`, which the rules allow only while none exists, and
 * ending archives the leaderboard to Firestore and removes `activeQuiz`.
 */
import {
  get,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from '@react-native-firebase/database';

import { archiveQuizResults, markQuizActive, markQuizDraft } from '@/features/quiz/quizApi';
import { database } from '@/services/firebase';
import { rtdbPaths } from '@/services/firebase/paths';
import {
  isGameStatus,
  type ActiveQuizMeta,
  type GameStatus,
  type LeaderboardEntry,
} from '@/types/game';
import type { Quiz } from '@/types/quiz';
import { QuizAlreadyActiveError } from '@/utils/appErrors';
import { withTimeout } from '@/utils/withTimeout';

import { byStanding, toQuizResults } from './standings';

/** Realtime Database writes resolve on server acknowledgement; don't wait forever. */
const WRITE_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Parsing: snapshot values are `unknown` until checked
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseActiveQuizMeta = (value: unknown): ActiveQuizMeta | null => {
  if (!isRecord(value)) return null;
  const { quizId, title, questionCount, status, startedBy, startedAt } = value;
  if (typeof quizId !== 'string' || typeof title !== 'string' || !isGameStatus(status)) return null;
  if (typeof startedBy !== 'string' || typeof startedAt !== 'number') return null;
  return {
    quizId,
    title,
    questionCount: typeof questionCount === 'number' ? questionCount : 0,
    status,
    startedBy,
    startedAt,
  };
};

const parseLeaderboardEntry = (value: unknown): LeaderboardEntry | null => {
  if (!isRecord(value)) return null;
  const { id, displayName, score, correctCount } = value;
  if (typeof id !== 'string' || typeof displayName !== 'string') return null;
  if (typeof score !== 'number' || typeof correctCount !== 'number') return null;
  return { id, displayName, score, correctCount };
};

const parseLeaderboard = (value: unknown): LeaderboardEntry[] =>
  isRecord(value)
    ? Object.values(value)
        .map(parseLeaderboardEntry)
        .filter((entry): entry is LeaderboardEntry => entry !== null)
        .sort(byStanding)
    : [];

const isPermissionDenied = (error: unknown) =>
  isRecord(error) && error.code === 'database/permission-denied';

// ---------------------------------------------------------------------------
// Commands (staff)
// ---------------------------------------------------------------------------

/**
 * Puts a draft quiz (with at least one question) live: `activeQuiz/meta` in the Realtime Database, then the
 * Firestore quiz as `active`. Fails with `QuizAlreadyActiveError` while another
 * quiz runs; if Firestore can't be updated, the live quiz is removed again.
 */
export const startQuiz = async (
  quiz: Pick<Quiz, 'id' | 'title' | 'questionCount'>,
  hostId: string,
) => {
  const metaRef = ref(database, rtdbPaths.activeQuizMeta);
  const current = await withTimeout(get(metaRef), WRITE_TIMEOUT_MS, 'Checking active quiz');
  if (current.exists()) throw new QuizAlreadyActiveError();

  try {
    await withTimeout(
      set(metaRef, {
        quizId: quiz.id,
        title: quiz.title,
        questionCount: quiz.questionCount,
        status: 'open',
        startedBy: hostId,
        startedAt: serverTimestamp(),
      }),
      WRITE_TIMEOUT_MS,
      'Starting quiz',
    );
  } catch (error) {
    // Another host started a quiz between the check and the write.
    if (isPermissionDenied(error) && (await get(metaRef)).exists()) {
      throw new QuizAlreadyActiveError();
    }
    throw error;
  }

  try {
    await markQuizActive(quiz.id);
  } catch (error) {
    await remove(ref(database, rtdbPaths.activeQuiz)).catch(() => undefined);
    await markQuizDraft(quiz.id).catch(() => undefined);
    throw error;
  }
};

/** Opens or closes (pauses) the active quiz. A closed quiz accepts no joins or answers. */
export const setActiveQuizStatus = (status: GameStatus) =>
  withTimeout(
    set(ref(database, rtdbPaths.activeQuizStatus), status),
    WRITE_TIMEOUT_MS,
    'Updating quiz status',
  );

/**
 * Ends the active quiz: archives the final leaderboard to Firestore
 * (`quizzes/{quizId}/results`, quiz `finished`), then removes `activeQuiz`.
 * Players keep their `joinedQuiz` record, so they can't join another quiz.
 */
export const endQuiz = async (quizId: string) => {
  const leaderboard = await withTimeout(
    get(ref(database, rtdbPaths.activeQuizLeaderboard)),
    WRITE_TIMEOUT_MS,
    'Reading leaderboard',
  );
  await archiveQuizResults(quizId, toQuizResults(parseLeaderboard(leaderboard.val())));
  await withTimeout(remove(ref(database, rtdbPaths.activeQuiz)), WRITE_TIMEOUT_MS, 'Ending quiz');
};

// ---------------------------------------------------------------------------
// Commands (players)
// ---------------------------------------------------------------------------

type JoiningPlayer = {
  id: string;
  displayName: string;
};

/**
 * Joins the active quiz, in one atomic update: the player's one-quiz lock
 * `joinedQuiz/{uid}`, their player entry and their leaderboard entry at 0.
 * Rules only allow it while the quiz is open and if the player never joined a quiz.
 */
export const joinQuiz = (quizId: string, { id, displayName }: JoiningPlayer) =>
  withTimeout(
    update(ref(database), {
      [rtdbPaths.joinedQuiz(id)]: { quizId, joinedAt: serverTimestamp() },
      [rtdbPaths.activeQuizPlayer(id)]: { id, displayName, joinedAt: serverTimestamp() },
      [rtdbPaths.activeQuizLeaderboardEntry(id)]: { id, displayName, score: 0, correctCount: 0 },
    }),
    WRITE_TIMEOUT_MS,
    'Joining quiz',
  );

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

const logListenerError = (label: string) => (error: Error) =>
  console.warn(`[game] ${label} listener failed`, error);

/** The active quiz's meta; `null` while no quiz runs. */
export const subscribeToActiveQuizMeta = (onMeta: (meta: ActiveQuizMeta | null) => void) =>
  onValue(
    ref(database, rtdbPaths.activeQuizMeta),
    (snapshot) => onMeta(parseActiveQuizMeta(snapshot.val())),
    logListenerError('meta'),
  );

/** The active quiz's standings, sorted. */
export const subscribeToLeaderboard = (onEntries: (entries: LeaderboardEntry[]) => void) =>
  onValue(
    ref(database, rtdbPaths.activeQuizLeaderboard),
    (snapshot) => onEntries(parseLeaderboard(snapshot.val())),
    logListenerError('leaderboard'),
  );

/** The quiz this account joined (`null` if none). */
export const subscribeToJoinedQuiz = (userId: string, onQuizId: (quizId: string | null) => void) =>
  onValue(
    ref(database, `${rtdbPaths.joinedQuiz(userId)}/quizId`),
    (snapshot) => {
      const quizId: unknown = snapshot.val();
      onQuizId(typeof quizId === 'string' ? quizId : null);
    },
    (error) => {
      logListenerError('joined quiz')(error);
      onQuizId(null);
    },
  );
