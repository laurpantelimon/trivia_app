/**
 * Firestore quizzes: `quizzes/{quizId}`, their questions (`questions/`, with the
 * correct options apart in `answerKey/`) and, once finished, their results
 * (`results/`). Staff only (enforced by rules). Running a quiz live happens in
 * the Realtime Database, see features/game/gameApi.ts.
 */
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import { firestore } from '@/services/firebase';
import { loadQuery, refreshLoadedQueries } from '@/services/firebase/loadedQuery';
import type { QuizResult } from '@/types/history';
import {
  isQuizStatus,
  type AnswerKeyDocument,
  type NewQuizDocument,
  type QuestionDocument,
  type Quiz,
  type QuizQuestion,
} from '@/types/quiz';
import { withTimeout } from '@/utils/withTimeout';

export const QUIZZES_COLLECTION = 'quizzes';
const QUESTIONS_SUBCOLLECTION = 'questions';
const ANSWER_KEY_SUBCOLLECTION = 'answerKey';
const RESULTS_SUBCOLLECTION = 'results';

const WRITE_TIMEOUT_MS = 10_000;
/** Firestore allows at most 500 writes per batch. */
const MAX_BATCH_WRITES = 500;

const quizRef = (quizId: string) => doc(firestore, QUIZZES_COLLECTION, quizId);
// Built from the root: RNFirebase's doc() can't take a DocumentReference as parent.
const questionRef = (quizId: string, questionId: string) =>
  doc(firestore, QUIZZES_COLLECTION, quizId, QUESTIONS_SUBCOLLECTION, questionId);
const answerKeyRef = (quizId: string, questionId: string) =>
  doc(firestore, QUIZZES_COLLECTION, quizId, ANSWER_KEY_SUBCOLLECTION, questionId);
const subcollection = (quizId: string, name: string) =>
  collection(firestore, QUIZZES_COLLECTION, quizId, name);

type Batch = ReturnType<typeof writeBatch>;
type BatchWrite = (batch: Batch) => void;

/** Commits writes in batches of at most 500, in order. */
const commitInBatches = async (writes: BatchWrite[], label: string) => {
  for (let start = 0; start < writes.length; start += MAX_BATCH_WRITES) {
    const batch = writeBatch(firestore);
    writes.slice(start, start + MAX_BATCH_WRITES).forEach((write) => write(batch));
    await withTimeout(batch.commit(), WRITE_TIMEOUT_MS, label);
  }
};

// ---------------------------------------------------------------------------
// Parsing: document data is `unknown` until checked
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Firestore `Timestamp` → milliseconds; `null` when absent or still pending. */
const toMillis = (value: unknown): number | null => {
  if (!isRecord(value) || typeof value.toMillis !== 'function') return null;
  const millis: unknown = value.toMillis();
  return typeof millis === 'number' ? millis : null;
};

const parseQuiz = (id: string, data: unknown): Quiz | null => {
  if (!isRecord(data)) return null;
  const { title, status, createdBy, questionCount, playerCount } = data;
  if (typeof title !== 'string' || !isQuizStatus(status) || typeof createdBy !== 'string') {
    return null;
  }
  return {
    id,
    title,
    status,
    createdBy,
    createdAt: toMillis(data.createdAt) ?? Date.now(),
    startedAt: toMillis(data.startedAt),
    endedAt: toMillis(data.endedAt),
    questionCount: typeof questionCount === 'number' ? questionCount : 0,
    playerCount: typeof playerCount === 'number' ? playerCount : null,
  };
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseQuestion = (
  id: string,
  data: unknown,
  correctOptions: ReadonlyMap<string, number>,
): QuizQuestion | null => {
  if (!isRecord(data)) return null;
  const { order, text, options } = data;
  if (typeof order !== 'number' || typeof text !== 'string' || !isStringArray(options)) return null;
  return { id, order, text, options, correctOption: correctOptions.get(id) ?? -1 };
};

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

type NewQuiz = Pick<Quiz, 'title' | 'createdBy'>;

/** Creates a draft quiz; any number can exist, started one at a time. Returns its id. */
export const createQuiz = async ({ title, createdBy }: NewQuiz) => {
  const ref = doc(collection(firestore, QUIZZES_COLLECTION));
  const quiz: NewQuizDocument = {
    id: ref.id,
    title,
    status: 'draft',
    createdBy,
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null,
    questionCount: 0,
    playerCount: null,
  };
  await withTimeout(setDoc(ref, quiz), WRITE_TIMEOUT_MS, 'Creating quiz');
  refreshLoadedQueries();
  return ref.id;
};

/**
 * Deletes a quiz that isn't live, with its questions, answer key and results.
 * Firestore doesn't delete subcollections with their parent, so they are
 * listed and deleted first; the quiz document goes last, so a retry after a
 * partial failure finds the rest again.
 */
export const deleteQuiz = async (quizId: string) => {
  const snapshots = await withTimeout(
    Promise.all(
      [QUESTIONS_SUBCOLLECTION, ANSWER_KEY_SUBCOLLECTION, RESULTS_SUBCOLLECTION].map((name) =>
        getDocs(subcollection(quizId, name)),
      ),
    ),
    WRITE_TIMEOUT_MS,
    'Reading quiz contents',
  );
  const deletes: BatchWrite[] = snapshots.flatMap((snapshot) =>
    snapshot.docs.map((child) => (batch: Batch) => batch.delete(child.ref)),
  );
  await commitInBatches([...deletes, (batch) => batch.delete(quizRef(quizId))], 'Deleting quiz');
  refreshLoadedQueries();
};

/** Marks the quiz as the one running (after it was put live in the Realtime Database). */
export const markQuizActive = async (quizId: string) => {
  await withTimeout(
    updateDoc(quizRef(quizId), { status: 'active', startedAt: serverTimestamp() }),
    WRITE_TIMEOUT_MS,
    'Marking quiz as active',
  );
  refreshLoadedQueries();
};

/** Puts a quiz back to draft (undoes `markQuizActive` when going live failed). */
export const markQuizDraft = async (quizId: string) => {
  await withTimeout(
    updateDoc(quizRef(quizId), { status: 'draft', startedAt: null }),
    WRITE_TIMEOUT_MS,
    'Resetting quiz',
  );
  refreshLoadedQueries();
};

/**
 * Archives a finished quiz: its final standings as `results/{uid}` and the quiz
 * as `finished`. The quiz document is written in the last batch, so a quiz only
 * reads as finished once all its results are stored; retrying is safe.
 */
export const archiveQuizResults = async (quizId: string, results: QuizResult[]) => {
  await commitInBatches(
    [
      ...results.map((result) => (batch: Batch) =>
        batch.set(doc(firestore, QUIZZES_COLLECTION, quizId, RESULTS_SUBCOLLECTION, result.id), result),
      ),
      (batch) =>
        batch.update(quizRef(quizId), {
          status: 'finished',
          endedAt: serverTimestamp(),
          playerCount: results.length,
        }),
    ],
    'Archiving quiz results',
  );
  refreshLoadedQueries();
};

// ---------------------------------------------------------------------------
// Questions (draft quizzes only; checked by the caller)
// ---------------------------------------------------------------------------

export type NewQuestion = Omit<QuizQuestion, 'id'>;

/** Adds a question and its answer key, and bumps `questionCount`, in one batch. */
export const addQuestion = async (quizId: string, { order, text, options, correctOption }: NewQuestion) => {
  const questionId = doc(subcollection(quizId, QUESTIONS_SUBCOLLECTION)).id;
  const question: QuestionDocument = { id: questionId, order, text, options };
  const answerKey: AnswerKeyDocument = { correctOption };
  const batch = writeBatch(firestore);
  batch.set(questionRef(quizId, questionId), question);
  batch.set(answerKeyRef(quizId, questionId), answerKey);
  batch.update(quizRef(quizId), { questionCount: increment(1) });
  await withTimeout(batch.commit(), WRITE_TIMEOUT_MS, 'Adding question');
  refreshLoadedQueries();
};

/** Removes a question and its answer key, and lowers `questionCount`, in one batch. */
export const removeQuestion = async (quizId: string, questionId: string) => {
  const batch = writeBatch(firestore);
  batch.delete(questionRef(quizId, questionId));
  batch.delete(answerKeyRef(quizId, questionId));
  batch.update(quizRef(quizId), { questionCount: increment(-1) });
  await withTimeout(batch.commit(), WRITE_TIMEOUT_MS, 'Removing question');
  refreshLoadedQueries();
};

// ---------------------------------------------------------------------------
// Reading (not live, see `loadQuery`)
// ---------------------------------------------------------------------------

/** All quizzes, newest first; read on open and after this device's writes (see `loadQuery`). */
export const loadQuizzes = (onQuizzes: (quizzes: Quiz[]) => void) =>
  loadQuery(
    query(collection(firestore, QUIZZES_COLLECTION), orderBy('createdAt', 'desc')),
    (documents) =>
      onQuizzes(
        documents
          .map(({ id, data }) => parseQuiz(id, data))
          .filter((quiz): quiz is Quiz => quiz !== null),
      ),
    (error) => {
      console.warn('[quiz] loading quizzes failed', error);
      onQuizzes([]);
    },
  );

/**
 * A quiz's questions in order, each with its correct option; read on open and
 * after this device's writes. Questions and answer keys are two queries; the
 * list is emitted once both have been read, and again when either is re-read.
 */
export const loadQuestions = (
  quizId: string,
  onQuestions: (questions: QuizQuestion[]) => void,
) => {
  let questionDocs: { id: string; data: unknown }[] | null = null;
  let correctOptions: Map<string, number> | null = null;

  const emit = () => {
    if (!questionDocs || !correctOptions) return;
    const answers = correctOptions;
    onQuestions(
      questionDocs
        .map(({ id, data }) => parseQuestion(id, data, answers))
        .filter((question): question is QuizQuestion => question !== null),
    );
  };
  const onError = (error: Error) => {
    console.warn('[quiz] loading questions failed', error);
    onQuestions([]);
  };

  const stopQuestions = loadQuery(
    query(subcollection(quizId, QUESTIONS_SUBCOLLECTION), orderBy('order', 'asc')),
    (documents) => {
      questionDocs = documents;
      emit();
    },
    onError,
  );
  const stopAnswers = loadQuery(
    subcollection(quizId, ANSWER_KEY_SUBCOLLECTION),
    (documents) => {
      correctOptions = new Map();
      for (const { id, data } of documents) {
        const correctOption: unknown = isRecord(data) ? data.correctOption : undefined;
        if (typeof correctOption === 'number') correctOptions.set(id, correctOption);
      }
      emit();
    },
    onError,
  );

  return () => {
    stopQuestions();
    stopAnswers();
  };
};
