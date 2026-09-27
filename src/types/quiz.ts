/**
 * Quiz types (Firestore `quizzes/{quizId}`). Staff create quizzes at any time;
 * one of them at a time is copied into the Realtime Database as the active quiz
 * (see `game.ts`).
 *
 * Lifecycle: `draft` → `active` (started) → `finished` (ended, results archived).
 * Questions can be added and removed only while the quiz is a draft.
 *
 *   quizzes/{quizId}                      QuizDocument
 *   quizzes/{quizId}/questions/{qId}      QuestionDocument   (text and options only)
 *   quizzes/{quizId}/answerKey/{qId}      AnswerKeyDocument  (kept apart so questions can be
 *                                                             shown to players without the answer)
 */

import type { FieldValue, Timestamp } from '@react-native-firebase/firestore';

export const QUIZ_STATUSES = ['draft', 'active', 'finished'] as const;

export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export const isQuizStatus = (value: unknown): value is QuizStatus =>
  typeof value === 'string' && QUIZ_STATUSES.some((status) => status === value);

export const QUIZ_TITLE_MIN_LENGTH = 2;
export const QUIZ_TITLE_MAX_LENGTH = 60;

/** App-side quiz. Timestamps are milliseconds; `null` until the event happened. */
export type Quiz = {
  id: string;
  title: string;
  status: QuizStatus;
  createdBy: string;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  /** Kept in step with `questions/` in the same batch. */
  questionCount: number;
  /** Players who joined; set when the quiz ends. */
  playerCount: number | null;
};

/** Exact shape of `quizzes/{quizId}`. */
export type QuizDocument = Omit<Quiz, 'createdAt' | 'startedAt' | 'endedAt'> & {
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
};

/** Data written when a quiz is created. */
export type NewQuizDocument = Omit<QuizDocument, 'createdAt'> & {
  createdAt: FieldValue;
};

export const QUESTION_TEXT_MIN_LENGTH = 3;
export const QUESTION_TEXT_MAX_LENGTH = 200;
export const OPTION_MAX_LENGTH = 80;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

/** A question as staff edit it: the question plus its correct option (from the answer key). */
export type QuizQuestion = {
  id: string;
  /** Sort key; questions are asked in ascending order. */
  order: number;
  text: string;
  options: string[];
  /** Index into `options`. */
  correctOption: number;
};

/** Exact shape of `quizzes/{quizId}/questions/{qId}`. */
export type QuestionDocument = Omit<QuizQuestion, 'correctOption'>;

/** Exact shape of `quizzes/{quizId}/answerKey/{qId}`. */
export type AnswerKeyDocument = Pick<QuizQuestion, 'correctOption'>;
